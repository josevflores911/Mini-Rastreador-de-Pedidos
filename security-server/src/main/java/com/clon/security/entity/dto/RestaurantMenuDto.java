package com.clon.security.entity.dto;

import com.clon.security.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantMenuDto {
    private RestaurantDto restaurant;
    private List<String> categories;
    private List<CategoryMenuDto> menuByCategory;
    private List<Product> products;
}
