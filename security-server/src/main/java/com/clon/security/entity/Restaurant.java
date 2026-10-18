package com.clon.security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Restaurant {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String cuisine;

    private String eta;

    private String tone;

    @Column(name = "is_open")
    private boolean isOpen;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}
