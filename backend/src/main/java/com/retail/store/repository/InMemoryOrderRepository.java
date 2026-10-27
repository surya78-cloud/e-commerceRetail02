package com.retail.store.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import com.retail.store.model.CustomerOrder;

@Repository
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "in-memory", matchIfMissing = true)
public class InMemoryOrderRepository implements OrderRepository {
    private final Map<String, CustomerOrder> storage = new ConcurrentHashMap<>();

    @Override
    public List<CustomerOrder> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public List<CustomerOrder> findAllByOrderByCreatedAtDesc() {
        List<CustomerOrder> list = new ArrayList<>(storage.values());
        list.sort(Comparator.comparing(CustomerOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return list;
    }

    @Override
    public Optional<CustomerOrder> findById(String id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public CustomerOrder save(CustomerOrder order) {
        if (order.getId() == null || order.getId().isBlank()) {
            order.setId(UUID.randomUUID().toString());
        }
        if (order.getCreatedAt() == null) {
            order.setCreatedAt(Instant.now());
        }
        storage.put(order.getId(), order);
        return order;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <S extends CustomerOrder> List<S> saveAll(Iterable<S> entities) {
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
