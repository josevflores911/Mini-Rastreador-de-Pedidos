package com.clon.security.controller;

import com.clon.security.entity.Order;
import com.clon.security.entity.dto.CancelOrderRequest;
import com.clon.security.entity.dto.CreateOrderRequest;
import com.clon.security.entity.dto.UpdateStatusRequest;
import com.clon.security.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@Tag(name = "Pedidos", description = "Endpoints para gerenciamento do ciclo de vida, rastreamento e cancelamento de pedidos")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Listar pedidos", description = "Recupera a lista de pedidos ordenados por data decrescente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de pedidos obtida com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<List<Order>> list() {
        return ResponseEntity.ok(orderService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter pedido por ID", description = "Retorna os detalhes completos de um pedido específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pedido encontrado"),
            @ApiResponse(responseCode = "404", description = "Pedido não encontrado"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<Order> getById(
            @Parameter(description = "Identificador único do pedido", example = "MM8K9Q") @PathVariable String id
    ) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Consultar status do pedido", description = "Retorna apenas os dados essenciais de status e histórico de rastreamento.")
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable String id) {
        Order order = orderService.getById(id);
        return ResponseEntity.ok(Map.of(
                "id", order.getId(),
                "status", order.getStatus(),
                "restaurantName", order.getRestaurantName(),
                "createdAt", order.getCreatedAt(),
                "updatedAt", order.getUpdatedAt(),
                "statusHistory", order.getStatusHistory()
        ));
    }

    @PostMapping
    @Operation(summary = "Criar novo pedido", description = "Registra um novo pedido com validação de itens, endereço e cálculo de valores.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pedido criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados da requisição inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<Order> create(
            @RequestBody CreateOrderRequest request,
            Authentication authentication
    ) {
        Order created = orderService.create(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/cancel")
    @Operation(
            summary = "Cancelar pedido",
            description = "Cancela um pedido ativo. Consumidores podem cancelar seus próprios pedidos enquanto não estiverem entregues. Administradores podem cancelar qualquer pedido."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pedido cancelado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status atual não permite cancelamento ou transição inválida"),
            @ApiResponse(responseCode = "403", description = "Usuário não autorizado a cancelar o pedido"),
            @ApiResponse(responseCode = "404", description = "Pedido não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de estado (pedido já cancelado ou já entregue)")
    })
    public ResponseEntity<Order> cancel(
            @Parameter(description = "ID do pedido a ser cancelado") @PathVariable String id,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication
    ) {
        String reason = request != null ? request.getReason() : null;
        Order cancelled = orderService.cancel(id, reason, authentication);
        return ResponseEntity.ok(cancelled);
    }

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Atualizar status do pedido (Admin / Sistema de Rastreamento)",
            description = "Executa a transição de status do pedido de acordo com o grafo da máquina de estados. " +
                    "Rejeita reativação de pedidos cancelados ou já entregues."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Transição inválida ou status não reconhecido"),
            @ApiResponse(responseCode = "403", description = "Permissão negada (requer perfil ADMIN)"),
            @ApiResponse(responseCode = "409", description = "Conflito de estado (pedido cancelado ou entregue)")
    })
    public ResponseEntity<Order> updateStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equalsIgnoreCase("ROLE_ADMIN") || a.equalsIgnoreCase("ADMIN"));

        Order updated = orderService.transitionStatus(id, request.getStatus(), isAdmin);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/transition")
    @Operation(summary = "Transicionar status do pedido", description = "Alias POST para atualização de status por integradores legados.")
    public ResponseEntity<Order> transitionStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request,
            Authentication authentication
    ) {
        return updateStatus(id, request, authentication);
    }
}
