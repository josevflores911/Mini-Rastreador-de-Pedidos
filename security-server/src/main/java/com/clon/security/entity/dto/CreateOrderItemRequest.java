package com.clon.security.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {
    private String productId;
    private String id; // fallback for productId
    private Integer quantity;

    public CreateOrderItemRequest(String productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String resolveProductId() {
        return productId != null && !productId.isBlank() ? productId : id;
    }
}
