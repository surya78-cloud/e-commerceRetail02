package com.retail.store.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.retail.store.model.CustomerOrder;
import com.retail.store.model.Product;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;

@Service
public class StoreService {
    private final ProductRepository products;
    private final OrderRepository orders;

    public StoreService(ProductRepository products, OrderRepository orders) {
        this.products = products;
        this.orders = orders;
    }

    public CustomerOrder placeOrder(String customerName, List<RequestedItem> requestedItems) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An order must contain at least one item");
        }

        // Aggregate quantities by product ID to avoid stock calculation bugs when items repeat
        Map<String, Integer> aggregatedQuantities = new LinkedHashMap<>();
        for (RequestedItem req : requestedItems) {
            if (req.productId() == null || req.productId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product ID is required for each order item");
            }
            if (req.quantity() < 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Item quantity must be at least 1");
            }
            aggregatedQuantities.merge(req.productId(), req.quantity(), Integer::sum);
        }

        List<CustomerOrder.OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        List<Product> changedProducts = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : aggregatedQuantities.entrySet()) {
            String productId = entry.getKey();
            int qty = entry.getValue();

            Product product = products.findById(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

            if (product.getStock() < qty) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for " + product.getName() + " (available: " + product.getStock() + ")");
            }

            product.setStock(product.getStock() - qty);
            changedProducts.add(product);

            items.add(new CustomerOrder.OrderItem(product.getId(), product.getName(), qty, product.getPrice()));
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        products.saveAll(changedProducts);
        return orders.save(new CustomerOrder(customerName, items, total));
    }

    public CustomerOrder updateOrderStatus(String orderId, String newStatus) {
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        String oldStatus = order.getStatus();
        if (oldStatus != null && oldStatus.equalsIgnoreCase(newStatus)) {
            return order;
        }

        // If order was cancelled, restore inventory stock
        if ("Cancelled".equalsIgnoreCase(newStatus) && !"Cancelled".equalsIgnoreCase(oldStatus)) {
            if (order.getItems() != null) {
                List<Product> productsToRestore = new ArrayList<>();
                for (CustomerOrder.OrderItem item : order.getItems()) {
                    products.findById(item.getProductId()).ifPresent(p -> {
                        p.setStock(p.getStock() + item.getQuantity());
                        productsToRestore.add(p);
                    });
                }
                if (!productsToRestore.isEmpty()) {
                    products.saveAll(productsToRestore);
                }
            }
        } else if ("Cancelled".equalsIgnoreCase(oldStatus) && !"Cancelled".equalsIgnoreCase(newStatus)) {
            // Re-activating a cancelled order: re-decrement stock if available
            if (order.getItems() != null) {
                List<Product> productsToDecrement = new ArrayList<>();
                for (CustomerOrder.OrderItem item : order.getItems()) {
                    Product p = products.findById(item.getProductId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Product no longer exists"));
                    if (p.getStock() < item.getQuantity()) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock to re-open order for " + p.getName());
                    }
                    p.setStock(p.getStock() - item.getQuantity());
                    productsToDecrement.add(p);
                }
                products.saveAll(productsToDecrement);
            }
        }

        order.setStatus(newStatus);
        return orders.save(order);
    }

    public record RequestedItem(String productId, int quantity) {}
    public record OrderRequest(String customerName, List<RequestedItem> items) {}
}
