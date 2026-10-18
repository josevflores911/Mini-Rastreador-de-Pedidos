package com.clon.security.repositories;

import com.clon.security.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByRestaurantId(String restaurantId);
    Optional<Product> findByIdAndRestaurantId(String id, String restaurantId);
}
