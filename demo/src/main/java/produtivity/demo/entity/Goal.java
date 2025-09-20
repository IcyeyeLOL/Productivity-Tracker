package produtivity.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "goals")
public class Goal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;
    
    @NotBlank
    @Size(max = 300)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type")
    private GoalType goalType = GoalType.TASK_COUNT;
    
    @Column(name = "target_value", nullable = false)
    private Integer targetValue;
    
    @Column(name = "current_value")
    private Integer currentValue = 0;
    
    @Size(max = 20)
    private String unit = "tasks";
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @Enumerated(EnumType.STRING)
    private GoalStatus status = GoalStatus.ACTIVE;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private ZonedDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
    
    // Enums
    public enum GoalType {
        TASK_COUNT, TIME_SPENT, PROJECT_COMPLETION
    }
    
    public enum GoalStatus {
        ACTIVE, COMPLETED, FAILED, PAUSED
    }
    
    // Constructors
    public Goal() {}
    
    public Goal(User user, String title, Integer targetValue, LocalDate startDate, LocalDate endDate) {
        this.user = user;
        this.title = title;
        this.targetValue = targetValue;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Project getProject() {
        return project;
    }
    
    public void setProject(Project project) {
        this.project = project;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public GoalType getGoalType() {
        return goalType;
    }
    
    public void setGoalType(GoalType goalType) {
        this.goalType = goalType;
    }
    
    public Integer getTargetValue() {
        return targetValue;
    }
    
    public void setTargetValue(Integer targetValue) {
        this.targetValue = targetValue;
    }
    
    public Integer getCurrentValue() {
        return currentValue;
    }
    
    public void setCurrentValue(Integer currentValue) {
        this.currentValue = currentValue;
    }
    
    public String getUnit() {
        return unit;
    }
    
    public void setUnit(String unit) {
        this.unit = unit;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public GoalStatus getStatus() {
        return status;
    }
    
    public void setStatus(GoalStatus status) {
        this.status = status;
    }
    
    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
