package com.retail.store.repository;

import java.util.List;
import java.util.Optional;
import com.retail.store.model.CustomerOrder;

public interface OrderRepository {
    List<CustomerOrder> findAll();
    List<CustomerOrder> findAllByOrderByCreatedAtDesc();
    Optional<CustomerOrder> findById(String id);
    CustomerOrder save(CustomerOrder order);
    <S extends CustomerOrder> List<S> saveAll(Iterable<S> entities);
    boolean existsById(String id);
    void deleteById(String id);
    long count();
    void deleteAll();
}
