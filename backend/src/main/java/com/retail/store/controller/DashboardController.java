package com.retail.store.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.retail.store.model.CustomerOrder;
import com.retail.store.model.Product;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ProductRepository products;
    private final OrderRepository orders;

    @Value("${app.storage.mode:in-memory}")
    private String storageMode;

    public DashboardController(ProductRepository products, OrderRepository orders) {
        this.products = products;
        this.orders = orders;
    }

    @GetMapping("/summary")
    public Summary summary() {
        List<Product> allProducts = products.findAll();
        List<CustomerOrder> allOrders = orders.findAll();
        BigDecimal revenue = allOrders.stream()
                .filter(order -> !"Cancelled".equalsIgnoreCase(order.getStatus()))
                .map(CustomerOrder::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long lowStock = allProducts.stream()
                .filter(product -> product.getStock() <= 5)
                .count();
        long unitsInStock = allProducts.stream()
                .mapToLong(Product::getStock)
                .sum();
        return new Summary(allProducts.size(), allOrders.size(), revenue, lowStock, unitsInStock, storageMode);
    }

    public record Summary(long productCount, long orderCount, BigDecimal revenue, long lowStockCount, long unitsInStock, String storageMode) {}
}
