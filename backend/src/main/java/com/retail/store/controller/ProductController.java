package com.retail.store.controller;

import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.retail.store.model.Product;
import com.retail.store.repository.ProductRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping
    public List<Product> list() {
        return products.findAll();
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable String id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody Product product) {
        if (product.getSku() != null && products.findBySku(product.getSku()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with SKU '" + product.getSku() + "' already exists");
        }
        return products.save(product);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable String id, @Valid @RequestBody Product product) {
        Product current = products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getSku() != null) {
            Optional<Product> existingWithSku = products.findBySku(product.getSku());
            if (existingWithSku.isPresent() && !existingWithSku.get().getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with SKU '" + product.getSku() + "' already exists");
            }
        }

        current.setName(product.getName());
        current.setSku(product.getSku());
        current.setCategory(product.getCategory());
        current.setPrice(product.getPrice());
        current.setStock(product.getStock());
        current.setDescription(product.getDescription());
        if (product.getStatus() != null && !product.getStatus().isBlank()) {
            current.setStatus(product.getStatus());
        }
        return products.save(current);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!products.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        products.deleteById(id);
    }
}
