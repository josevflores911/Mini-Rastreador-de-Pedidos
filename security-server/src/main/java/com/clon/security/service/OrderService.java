package com.clon.security.service;

import com.clon.security.entity.Order;
import com.clon.security.entity.OrderItem;
import com.clon.security.entity.OrderStatusHistory;
import com.clon.security.entity.Product;
import com.clon.security.entity.Restaurant;
import com.clon.security.entity.dto.CreateOrderItemRequest;
import com.clon.security.entity.dto.CreateOrderRequest;
import com.clon.security.exception.ForbiddenException;
import com.clon.security.exception.ResourceNotFoundException;
import com.clon.security.repositories.OrderRepository;
import com.clon.security.repositories.ProductRepository;
import com.clon.security.repositories.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
            "RECEBIDO", List.of("CONFIRMADO", "CANCELADO"),
            "CONFIRMADO", List.of("EM_PREPARO", "CANCELADO"),
            "EM_PREPARO", List.of("PRONTO_PARA_RETIRADA", "SAIU_PARA_ENTREGA", "CANCELADO"),
            "PRONTO_PARA_RETIRADA", List.of("SAIU_PARA_ENTREGA", "CANCELADO"),
            "SAIU_PARA_ENTREGA", List.of("ENTREGUE", "CANCELADO"),
            "ENTREGUE", List.of(),
            "CANCELADO", List.of()
    );

    private static final Map<String, String> STATUS_DESCRIPTIONS = Map.of(
            "RECEBIDO", "Pedido registrado pelo sistema e aguardando confirmação do restaurante.",
            "CONFIRMADO", "Pedido aceito e confirmado pelo restaurante.",
            "EM_PREPARO", "Restaurante preparando os produtos selecionados.",
            "PRONTO_PARA_RETIRADA", "Pedido pronto, embalado e aguardando coleta do entregador.",
            "SAIU_PARA_ENTREGA", "Pedido em trânsito com o entregador a caminho do seu endereço.",
            "ENTREGUE", "Pedido entregue com sucesso no endereço informado. Bom apetite!",
            "CANCELADO", "Pedido cancelado."
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final RestaurantRepository restaurantRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            RestaurantRepository restaurantRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public List<Order> list() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public Order getById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado: " + id));
    }

    @Transactional
    public Order create(CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve conter ao menos um item.");
        }

        String address = request.resolveDeliveryAddress();
        if (address.isBlank()) {
            throw new IllegalArgumentException("O endereço de entrega é obrigatório.");
        }

        String restaurantId = null;
        List<OrderItem> items = new ArrayList<>();
        long totalCents = 0;

        for (int i = 0; i < request.getItems().size(); i++) {
            CreateOrderItemRequest itemReq = request.getItems().get(i);
            String productId = itemReq.resolveProductId();
            Integer quantity = itemReq.getQuantity();

            if (productId == null || productId.isBlank()) {
                throw new IllegalArgumentException("O item no índice " + i + " não possui um productId válido.");
            }
            if (quantity == null || quantity <= 0) {
                throw new IllegalArgumentException("A quantidade para o produto " + productId + " deve ser maior que zero.");
            }

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Produto '" + productId + "' não encontrado."));

            if (!product.isAvailable()) {
                throw new IllegalStateException("O produto '" + product.getName() + "' está indisponível para pedidos no momento.");
            }

            if (restaurantId == null) {
                restaurantId = product.getRestaurantId();
            } else if (!restaurantId.equals(product.getRestaurantId())) {
                throw new IllegalArgumentException("Não é permitido incluir produtos de restaurantes diferentes no mesmo pedido.");
            }

            long unitPriceCents = Math.round(product.getUnitPrice() * 100.0);
            long subtotalCents = unitPriceCents * quantity;
            totalCents += subtotalCents;

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(product.getUnitPrice());
            orderItem.setSubtotal(subtotalCents / 100.0);
            items.add(orderItem);
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        String restaurantName = restaurant != null ? restaurant.getName()
                : (request.getRestaurantName() != null ? request.getRestaurantName() : "Restaurante");

        double total = totalCents / 100.0;
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        String orderId = (Long.toString(System.currentTimeMillis(), 36) + UUID.randomUUID().toString().substring(0, 4)).toUpperCase();

        Order order = new Order();
        order.setId(orderId);
        order.setClient(request.getClient() != null && !request.getClient().isBlank() ? request.getClient().trim() : "Consumidor");
        String clientEmail = request.getClientEmail() != null && !request.getClientEmail().isBlank()
                ? request.getClientEmail().trim()
                : null;
        order.setClientEmail(clientEmail);
        order.setRestaurantId(restaurantId);
        order.setRestaurantName(restaurantName);
        order.setDeliveryAddress(address);
        order.setLatitude(request.resolveLatitude());
        order.setLongitude(request.resolveLongitude());
        order.setSubtotal(total);
        order.setTotal(total);
        order.setStatus("RECEBIDO");
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setItems(items);

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus("RECEBIDO");
        history.setDescription(STATUS_DESCRIPTIONS.get("RECEBIDO"));
        history.setTimestamp(now);
        order.getStatusHistory().add(history);

        return orderRepository.save(order);
    }

    @Transactional
    public Order create(CreateOrderRequest request, org.springframework.security.core.Authentication authentication) {
        Order order = create(request);
        if (order.getClientEmail() == null && authentication != null && authentication.getName() != null) {
            order.setClientEmail(authentication.getName());
            order = orderRepository.save(order);
        }
        return order;
    }

    /**
     * Cancela um pedido existente.
     * Consumidores só podem cancelar seus próprios pedidos enquanto não estiverem ENTREGUES ou já CANCELADOS.
     * Administradores podem cancelar qualquer pedido não finalizado.
     */
    @Transactional
    public Order cancel(String orderId, String reason, org.springframework.security.core.Authentication authentication) {
        Order order = getById(orderId);
        String currentStatus = order.getStatus();

        // 1. Invariante: Pedido já cancelado
        if ("CANCELADO".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("O pedido #" + orderId + " já se encontra cancelado.");
        }

        // 2. Invariante: Pedido já entregue
        if ("ENTREGUE".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Não é possível cancelar o pedido #" + orderId + " pois ele já foi entregue.");
        }

        // 3. Regra de autorização
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equalsIgnoreCase("ROLE_ADMIN") || a.equalsIgnoreCase("ADMIN"));

        if (!isAdmin && authentication != null) {
            String currentUsername = authentication.getName();
            boolean isOwner = (order.getClientEmail() != null && order.getClientEmail().equalsIgnoreCase(currentUsername))
                    || (order.getClient() != null && order.getClient().equalsIgnoreCase(currentUsername));

            if (order.getClientEmail() != null && !order.getClientEmail().isBlank() && !isOwner) {
                throw new ForbiddenException("Operação não autorizada. Você só tem permissão para cancelar seus próprios pedidos.");
            }
        }

        // 4. Validação na máquina de estados
        List<String> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, Collections.emptyList());
        if (!allowed.contains("CANCELADO")) {
            throw new IllegalStateException("Não é permitido cancelar o pedido #" + orderId + " com status '" + currentStatus + "'.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        order.setStatus("CANCELADO");
        order.setUpdatedAt(now);

        String description = (reason != null && !reason.trim().isBlank())
                ? "Pedido cancelado. Motivo: " + reason.trim()
                : (isAdmin ? "Pedido cancelado pela administração/restaurante." : "Pedido cancelado pelo cliente.");

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus("CANCELADO");
        history.setDescription(description);
        history.setTimestamp(now);
        order.getStatusHistory().add(history);

        return orderRepository.save(order);
    }

    @Transactional
    public Order transitionStatus(String orderId, String targetStatus, boolean isAdmin) {
        if (!isAdmin) {
            throw new ForbiddenException("Operação não autorizada. Consumidores não têm permissão para alterar manualmente o status do pedido.");
        }

        if (targetStatus == null || targetStatus.isBlank()) {
            throw new IllegalArgumentException("O status deve ser informado.");
        }

        String normalizedStatus = targetStatus.trim().toUpperCase();
        if (!STATUS_DESCRIPTIONS.containsKey(normalizedStatus)) {
            throw new IllegalArgumentException("Status '" + targetStatus + "' não é um status válido.");
        }

        Order order = getById(orderId);
        String currentStatus = order.getStatus();

        // 1. Idempotência: se já está no status solicitado, retorna sem erro
        if (currentStatus.equalsIgnoreCase(normalizedStatus)) {
            return order;
        }

        // 2. Proteção contra reativação de pedidos cancelados
        if ("CANCELADO".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Operação rejeitada: o pedido #" + orderId + " está CANCELADO e não pode retornar a um estado ativo por atualizações de rastreamento.");
        }

        // 3. Proteção contra alteração de pedidos já entregues
        if ("ENTREGUE".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Operação rejeitada: o pedido #" + orderId + " já foi ENTREGUE e este é um estado final imutável.");
        }

        // 4. Verificação estrita da transição no grafo de estados
        List<String> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, Collections.emptyList());
        if (!allowed.contains(normalizedStatus)) {
            throw new IllegalStateException("Transição de status inválida: não é permitido transicionar de '" + currentStatus + "' para '" + normalizedStatus + "'.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        order.setStatus(normalizedStatus);
        order.setUpdatedAt(now);

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus(normalizedStatus);
        history.setDescription(STATUS_DESCRIPTIONS.getOrDefault(normalizedStatus, "Status atualizado para " + normalizedStatus + "."));
        history.setTimestamp(now);
        order.getStatusHistory().add(history);

        return orderRepository.save(order);
    }
}
