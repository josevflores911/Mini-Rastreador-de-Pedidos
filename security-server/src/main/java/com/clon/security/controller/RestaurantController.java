package com.clon.security.controller;

import com.clon.security.entity.Product;
import com.clon.security.entity.dto.RestaurantDto;
import com.clon.security.entity.dto.RestaurantMenuDto;
import com.clon.security.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
@Tag(name = "Restaurantes", description = "Endpoints para consulta de estabelecimentos, cardápios e produtos")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    @Operation(summary = "Listar restaurantes", description = "Retorna a lista completa de restaurantes parceiros disponíveis.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista recuperada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<List<RestaurantDto>> list() {
        return ResponseEntity.ok(restaurantService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter dados do restaurante", description = "Retorna informações detalhadas de um restaurante específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Restaurante encontrado"),
            @ApiResponse(responseCode = "404", description = "Restaurante não encontrado"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<RestaurantDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(restaurantService.getById(id));
    }

    @GetMapping("/{id}/menu")
    @Operation(summary = "Obter cardápio do restaurante", description = "Retorna o cardápio oficial com produtos categorizados para seleção do cliente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cardápio obtido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Restaurante não encontrado"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<RestaurantMenuDto> getMenu(@PathVariable String id) {
        return ResponseEntity.ok(restaurantService.getMenu(id));
    }

    @GetMapping("/{id}/products/{productId}")
    @Operation(summary = "Consultar produto do restaurante", description = "Retorna os detalhes e preço unitário de um item específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Produto encontrado"),
            @ApiResponse(responseCode = "404", description = "Produto ou restaurante não encontrado"),
            @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<Product> getProduct(@PathVariable String id, @PathVariable String productId) {
        return ResponseEntity.ok(restaurantService.getProduct(id, productId));
    }
}
