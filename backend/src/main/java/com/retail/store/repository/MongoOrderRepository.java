package com.retail.store.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import com.retail.store.model.CustomerOrder;

@Repository
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "mongodb")
public class MongoOrderRepository implements OrderRepository {
    private final MongoTemplate mongoTemplate;

    public MongoOrderRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<CustomerOrder> findAll() {
        return mongoTemplate.findAll(CustomerOrder.class);
    }

    @Override
    public List<CustomerOrder> findAllByOrderByCreatedAtDesc() {
        Query query = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, CustomerOrder.class);
    }

    @Override
    public Optional<CustomerOrder> findById(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, CustomerOrder.class));
    }

    @Override
    public CustomerOrder save(CustomerOrder order) {
        return mongoTemplate.save(order);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <S extends CustomerOrder> List<S> saveAll(Iterable<S> entities) {
        List<S> list = new ArrayList<>();
        for (S item : entities) {
            list.add((S) mongoTemplate.save(item));
        }
        return list;
    }

    @Override
    public boolean existsById(String id) {
        return mongoTemplate.exists(Query.query(Criteria.where("id").is(id)), CustomerOrder.class);
    }

    @Override
    public void deleteById(String id) {
        mongoTemplate.remove(Query.query(Criteria.where("id").is(id)), CustomerOrder.class);
    }

    @Override
    public long count() {
        return mongoTemplate.count(new Query(), CustomerOrder.class);
    }

    @Override
    public void deleteAll() {
        mongoTemplate.remove(new Query(), CustomerOrder.class);
    }
}
