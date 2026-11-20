package com.coursely.model;

import jakarta.persistence.*;

@Entity
@Table(name = "categories", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 80) private String name;

    protected Category() {}
    public Category(String name) { this.name = name; }
    public Long getId() { return id; }
    public String getName() { return name; } public void setName(String v) { name = v; }
}
