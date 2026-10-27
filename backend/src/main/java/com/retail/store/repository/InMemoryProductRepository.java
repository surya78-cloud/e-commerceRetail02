package com.retail.store.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import com.retail.store.model.Product;

@Repository
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "in-memory", matchIfMissing = true)
public class InMemoryProductRepository implements ProductRepository {
    private final Map<String, Product> storage = new ConcurrentHashMap<>();

    @Override
    public List<Product> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public Optional<Product> findById(String id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Optional<Product> findBySku(String sku) {
        if (sku == null) return Optional.empty();
        return storage.values().stream()
                .filter(p -> sku.equalsIgnoreCase(p.getSku()))
                .findFirst();
    }

    @Override
    public Product save(Product product) {
        if (product.getId() == null || product.getId().isBlank()) {
            product.setId(UUID.randomUUID().toString());
        }
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(Instant.now());
        }
        storage.put(product.getId(), product);
        return product;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <S extends Product> List<S> saveAll(Iterable<S> entities) {
        List<S> saved = new ArrayList<>();
        for (S entity : entities) {
            saved.add((S) save(entity));
        }
        return saved;
    }

    @Override
    public boolean existsById(String id) {
        if (id == null) return false;
        return storage.containsKey(id);
    }

    @Override
    public void deleteById(String id) {
        if (id != null) {
            storage.remove(id);
        }
    }

    @Override
    public long count() {
        return storage.size();
    }

    @Override
    public void deleteAll() {
        storage.clear();
    }
}
