package com.clon.security.service;

import com.clon.security.entity.Product;
import com.clon.security.entity.Restaurant;
import com.clon.security.entity.dto.CategoryMenuDto;
import com.clon.security.entity.dto.RestaurantDto;
import com.clon.security.entity.dto.RestaurantMenuDto;
import com.clon.security.exception.ResourceNotFoundException;
import com.clon.security.repositories.ProductRepository;
import com.clon.security.repositories.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final ProductRepository productRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, ProductRepository productRepository) {
        this.restaurantRepository = restaurantRepository;
        this.productRepository = productRepository;
    }

    public List<RestaurantDto> list() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return restaurants.stream().map(this::toDto).collect(Collectors.toList());
    }

    public RestaurantDto getById(String id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurante não encontrado: " + id));
        return toDto(restaurant);
    }

    public RestaurantMenuDto getMenu(String id) {
        RestaurantDto restaurantDto = getById(id);
        List<Product> products = productRepository.findByRestaurantId(id);

        List<String> categories = products.stream()
                .map(Product::getCategory)
                .distinct()
                .collect(Collectors.toList());

        List<CategoryMenuDto> menuByCategory = categories.stream()
                .map(cat -> new CategoryMenuDto(
                        cat,
                        products.stream().filter(p -> cat.equals(p.getCategory())).collect(Collectors.toList())
                ))
                .collect(Collectors.toList());

        return RestaurantMenuDto.builder()
                .restaurant(restaurantDto)
                .categories(categories)
                .menuByCategory(menuByCategory)
                .products(products)
                .build();
    }

    public Product getProduct(String restaurantId, String productId) {
        return productRepository.findByIdAndRestaurantId(productId, restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado para este restaurante."));
    }

    private RestaurantDto toDto(Restaurant restaurant) {
        List<Product> products = productRepository.findByRestaurantId(restaurant.getId());
        List<String> categories = products.stream()
                .map(Product::getCategory)
                .distinct()
                .collect(Collectors.toList());

        return RestaurantDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .cuisine(restaurant.getCuisine())
                .eta(restaurant.getEta())
                .tone(restaurant.getTone())
                .isOpen(restaurant.isOpen())
                .imageUrl(restaurant.getImageUrl())
                .productsCount(products.size())
                .categories(categories)
                .build();
    }
}
