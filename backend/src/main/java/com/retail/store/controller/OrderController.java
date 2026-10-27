package com.retail.store.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.retail.store.model.CustomerOrder;
import com.retail.store.repository.OrderRepository;
import com.retail.store.service.StoreService;
import com.retail.store.service.StoreService.OrderRequest;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orders;
    private final StoreService store;

    public OrderController(OrderRepository orders, StoreService store) {
        this.orders = orders;
        this.store = store;
    }

    @GetMapping
    public List<CustomerOrder> list() {
        return orders.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public CustomerOrder getById(@PathVariable String id) {
        return orders.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrder create(@RequestBody OrderRequest request) {
        if (request == null || request.customerName() == null || request.customerName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }
        return store.placeOrder(request.customerName().trim(), request.items());
    }

    @PatchMapping("/{id}/status")
    public CustomerOrder updateStatus(@PathVariable String id, @RequestParam String value) {
        if (!List.of("New", "Processing", "Shipped", "Completed", "Cancelled").contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported order status: " + value);
        }
        return store.updateOrderStatus(id, value);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!orders.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        orders.deleteById(id);
    }
}
