package com.clon.security.entity.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private String client;
    private String clientEmail;
    private Object deliveryAddress;
    private Double latitude;
    private Double longitude;
    private String restaurantId;
    private String restaurantName;
    private List<CreateOrderItemRequest> items;

    public String resolveDeliveryAddress() {
        if (deliveryAddress == null) return "";
        if (deliveryAddress instanceof String) {
            return ((String) deliveryAddress).trim();
        }
        if (deliveryAddress instanceof Map<?, ?> map) {
            Object formatted = map.get("formattedAddress");
            if (formatted instanceof String) return ((String) formatted).trim();
            Object street = map.get("street");
            if (street instanceof String) return ((String) street).trim();
        }
        return deliveryAddress.toString();
    }

    public Double resolveLatitude() {
        if (latitude != null) return latitude;
        if (deliveryAddress instanceof Map<?, ?> map) {
            Object lat = map.get("latitude");
            if (lat instanceof Number) return ((Number) lat).doubleValue();
        }
        return null;
    }

    public Double resolveLongitude() {
        if (longitude != null) return longitude;
        if (deliveryAddress instanceof Map<?, ?> map) {
            Object lng = map.get("longitude");
            if (lng instanceof Number) return ((Number) lng).doubleValue();
        }
        return null;
    }
}
