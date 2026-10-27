package com.retail.store.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import com.retail.store.model.Product;

@Repository
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "mongodb")
public class MongoProductRepository implements ProductRepository {
    private final MongoTemplate mongoTemplate;

    public MongoProductRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<Product> findAll() {
        return mongoTemplate.findAll(Product.class);
    }

    @Override
    public Optional<Product> findById(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, Product.class));
    }

    @Override
    public Optional<Product> findBySku(String sku) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("sku").is(sku)), Product.class));
    }

    @Override
    public Product save(Product product) {
        return mongoTemplate.save(product);
    }

    @Override
    public <S extends Product> List<S> saveAll(Iterable<S> entities) {
        List<S> list = new ArrayList<>();
        for (S item : entities) {
            list.add(mongoTemplate.save(item));
        }
        return list;
    }

    @Override
    public boolean existsById(String id) {
        return mongoTemplate.exists(Query.query(Criteria.where("id").is(id)), Product.class);
    }

    @Override
    public void deleteById(String id) {
        mongoTemplate.remove(Query.query(Criteria.where("id").is(id)), Product.class);
    }

    @Override
    public long count() {
        return mongoTemplate.count(new Query(), Product.class);
    }

    @Override
    public void deleteAll() {
        mongoTemplate.remove(new Query(), Product.class);
    }
}
