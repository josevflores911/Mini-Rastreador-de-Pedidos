package com.clon.security.entity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDto {
    private String id;
    private String name;
    private String description;
    private String cuisine;
    private String eta;
    private String tone;
    @JsonProperty("isOpen")
    private boolean isOpen;
    private String imageUrl;
    private int productsCount;
    private List<String> categories;
}
