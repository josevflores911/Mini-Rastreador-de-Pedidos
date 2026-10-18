package com.clon.security;

import com.clon.security.entity.Order;
import com.clon.security.entity.dto.CreateOrderItemRequest;
import com.clon.security.entity.dto.CreateOrderRequest;
import com.clon.security.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderCancellationAndTrackingTests {

    @Autowired
    private OrderService orderService;

    private CreateOrderRequest createSampleOrderRequest() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setClient("Cliente Teste");
        request.setClientEmail("cliente@teste.com");
        request.setRestaurantName("Burger Brasa");
        request.setDeliveryAddress("Av. Paulista, 1000, Bela Vista, São Paulo - SP");
        request.setItems(List.of(
                new CreateOrderItemRequest("prod-bb-1", 1)
        ));
        return request;
    }

    @Test
    @DisplayName("Deve permitir o cancelamento de um pedido ativo pelo cliente")
    void shouldCancelActiveOrderByClient() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "cliente@teste.com",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        Order order = orderService.create(createSampleOrderRequest(), auth);
        assertNotNull(order.getId());
        assertEquals("RECEBIDO", order.getStatus());

        Order cancelled = orderService.cancel(order.getId(), "Mudança de planos", auth);
        assertEquals("CANCELADO", cancelled.getStatus());
        assertTrue(cancelled.getStatusHistory().stream()
                .anyMatch(h -> "CANCELADO".equals(h.getStatus()) && h.getDescription().contains("Mudança de planos")));
    }

    @Test
    @DisplayName("Deve impedir que atualizações externas de rastreamento reativem um pedido cancelado")
    void shouldPreventExternalTrackingFromReactivatingCancelledOrder() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "cliente@teste.com",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        Order order = orderService.create(createSampleOrderRequest(), auth);
        orderService.cancel(order.getId(), "Cancelado pelo cliente", auth);

        // Tentativa de uma API externa atualizar para CONFIRMADO ou EM_PREPARO
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            orderService.transitionStatus(order.getId(), "CONFIRMADO", true);
        });

        assertTrue(ex.getMessage().contains("CANCELADO e não pode retornar a um estado ativo"));
    }

    @Test
    @DisplayName("Deve impedir o cancelamento de um pedido que já foi entregue")
    void shouldPreventCancellingDeliveredOrder() {
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@chego.com",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        Order order = orderService.create(createSampleOrderRequest(), adminAuth);
        // Avançar até ENTREGUE
        orderService.transitionStatus(order.getId(), "CONFIRMADO", true);
        orderService.transitionStatus(order.getId(), "EM_PREPARO", true);
        orderService.transitionStatus(order.getId(), "SAIU_PARA_ENTREGA", true);
        orderService.transitionStatus(order.getId(), "ENTREGUE", true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            orderService.cancel(order.getId(), "Quero cancelar agora", adminAuth);
        });

        assertTrue(ex.getMessage().contains("já foi entregue"));
    }

    @Test
    @DisplayName("Deve ser idempotente quando a API de rastreamento reenviar o mesmo status")
    void shouldBeIdempotentOnSameStatusUpdate() {
        Order order = orderService.create(createSampleOrderRequest());
        orderService.transitionStatus(order.getId(), "CONFIRMADO", true);

        // Reenvio do mesmo status CONFIRMADO
        Order same = orderService.transitionStatus(order.getId(), "CONFIRMADO", true);
        assertEquals("CONFIRMADO", same.getStatus());
    }
}
