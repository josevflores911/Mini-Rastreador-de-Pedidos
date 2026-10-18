package com.clon.security.entity.dto;

import com.clon.security.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryMenuDto {
    private String category;
    private List<Product> items;
}
