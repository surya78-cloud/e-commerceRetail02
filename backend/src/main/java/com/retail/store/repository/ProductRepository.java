package com.retail.store.repository;

import java.util.List;
import java.util.Optional;
import com.retail.store.model.Product;

public interface ProductRepository {
    List<Product> findAll();
    Optional<Product> findById(String id);
    Optional<Product> findBySku(String sku);
    Product save(Product product);
    <S extends Product> List<S> saveAll(Iterable<S> entities);
    boolean existsById(String id);
    void deleteById(String id);
    long count();
    void deleteAll();
}
