package com.alumniweb.alumniweb.model;

import com.alumniweb.alumniweb.model.enums.Availability;
import com.alumniweb.alumniweb.model.enums.CurrentStatus;
import com.alumniweb.alumniweb.model.enums.Gender;
import com.alumniweb.alumniweb.model.enums.MaritalStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.SourceType;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "requests"})
@Entity
@Table(name = "master_alumni",
       uniqueConstraints = @UniqueConstraint(name = "uq_master_register_number", columnNames = "register_number"),
       indexes = {
           @Index(name = "idx_master_email", columnList = "email"),
           @Index(name = "idx_master_department", columnList = "department"),
           @Index(name = "idx_master_batch", columnList = "batch"),
           @Index(name = "idx_master_year_of_passing", columnList = "year_of_passing"),
           @Index(name = "idx_master_current_status", columnList = "current_status")
       })
@SQLRestriction("deleted = false")
public class MasterAlumni {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @NotBlank
    @Column(name = "register_number", nullable = false, length = 50)
    private String registerNumber;

    @NotBlank
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "degree", length = 100)
    private String degree;

    @Column(name = "batch", length = 50)
    private String batch;

    @Column(name = "year_of_passing")
    private Integer yearOfPassing;

    @Email
    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "dob")
    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private Gender gender;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "company", length = 200)
    private String company;

    @Column(name = "designation", length = 200)
    private String designation;

    @Column(name = "profession", length = 200)
    private String profession;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 20)
    private MaritalStatus maritalStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability", length = 20)
    private Availability availability;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", length = 20)
    private CurrentStatus currentStatus;

    @OneToOne(mappedBy = "masterAlumni")
    private User user;

    @Builder.Default
    @OneToMany(mappedBy = "masterAlumni", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Request> requests = new ArrayList<>();

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp(source = SourceType.DB)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp(source = SourceType.DB)
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
