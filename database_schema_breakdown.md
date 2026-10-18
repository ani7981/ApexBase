# Comprehensive Database Schema Specification

This document provides an exhaustive, element-by-element breakdown of the ER Diagram. It details every entity, attribute (including keys and types), relationship, cardinality constraint, and EER subclass hierarchy.

---

## 1. Strong Entities and Attributes

Strong entities exist independently within the database. 

### Squadron
* **Type:** Strong Entity
* **Attributes:**
  * `Sqd_id`: **Primary Key** (Underlined) - Uniquely identifies a squadron.
  * `Callsign`: Simple Attribute.
  * `Specialization`: Simple Attribute.

### Personnel
* **Type:** Strong Entity (Superclass)
* **Attributes:**
  * `Service_id`: **Primary Key** (Underlined) - Uniquely identifies a personnel member.
  * `Name`: **Composite Attribute** - Branches into two simple attributes:
    * `fname` (First Name)
    * `lname` (Last Name)
  * `total_flight_hours`: Simple Attribute.
  * `Contact_no`: **Multivalued Attribute** (Double Oval) - Indicates a person can have zero, one, or multiple contact numbers.

### Aircraft
* **Type:** Strong Entity
* **Attributes:**
  * `Tail_no`: **Primary Key** (Underlined) - Uniquely identifies an aircraft.
  * `Status`: Simple Attribute.
  * `Model`: Simple Attribute.

### Mission
* **Type:** Strong Entity (Superclass)
* **Attributes:**
  * `Mission_id`: **Primary Key** (Underlined) - Uniquely identifies a mission.

### Munition
* **Type:** Strong Entity
* **Attributes:**
  * `Munition_id`: **Primary Key** (Underlined) - Uniquely identifies a munition type or batch.
  * `Type`: Simple Attribute.
  * `Stock`: Simple Attribute.

---

## 2. Weak Entities and Identifying Relationships

Weak entities depend on a strong entity for their existence and identification.

### Maintenance_log
* **Type:** Weak Entity (Double Rectangle)
* **Attributes:**
  * `log_date`: **Partial Key / Discriminator** (Underlined with "partial" notation) - Uniquely identifies a log *only* within the context of the specific aircraft it belongs to.
* **Identifying Relationship:** `Requires` (Double Diamond)
  * **Cardinality:** `Aircraft` (1) to `Maintenance_log` (N).
  * **Meaning:** One aircraft requires many maintenance logs, but a maintenance log cannot exist without its specific parent aircraft.

---

## 3. Enhanced ER (EER) Subclasses

### Personnel Subclasses (Disjoint Constraint)
* **Constraint:** **Disjoint (`d`)** - A member of `Personnel` can be a `Pilot` OR a `Technician`, but cannot be both.
* **Subclasses:**
  * **Pilot:** Inherits all `Personnel` attributes and adds `Flight_rating`.
  * **Technician:** Inherits all `Personnel` attributes and adds `Clearance_lvl`.

### Mission Subclasses (Overlapping Constraint)
* **Constraint:** **Overlapping (`o`)** - A `Mission` can be a `Combat_mission`, a `Training_mission`, or *both* simultaneously.
* **Subclasses:**
  * **Combat_mission:** Inherits all `Mission` attributes.
  * **Training_mission:** Inherits all `Mission` attributes.

---

## 4. Standard and Recursive Relationships

### Employs
* **Type:** Binary Relationship
* **Entities Connected:** `Squadron` and `Personnel`
* **Cardinality:** `1 : N` (One Squadron employs Many Personnel).

### Commands
* **Type:** Binary Relationship
* **Entities Connected:** `Squadron` and `Aircraft`
* **Cardinality:** `1 : N` (One Squadron commands Many Aircraft).

### Reports_to (Recursive)
* **Type:** Unary / Recursive Relationship
* **Entity Connected:** `Squadron` (connects to itself)
* **Roles & Cardinality:** 
  * `Commander`: The superior squadron.
  * `Subordinate N`: The squadrons under command.
  * **Meaning:** Establishes a 1-to-N hierarchy where one Commander squadron oversees N Subordinate squadrons.

---

## 5. Ternary Relationships and Aggregation

### Manifest (Ternary Relationship)
* **Type:** 3-Way Relationship
* **Entities Connected:** `Personnel`, `Aircraft`, `Mission`
* **Cardinalities:** `N : M : P`
* **Meaning:** Maps exactly which personnel member operated which aircraft during which specific mission.

### Aggregation Block & Munitions Assignment
* **Aggregation:** The entire `Manifest` relationship is wrapped in an **Aggregation Block** (dashed boundary). 
* **Reasoning:** In database modeling, you cannot link a relationship directly to another relationship. By using Aggregation, the database treats the `Manifest` (the instance of Pilot + Aircraft + Mission) as a single, higher-level entity.
* **Uses_loadout Relationship:**
  * **Entities Connected:** `Manifest` (Aggregation) and `Munition`.
  * **Cardinality:** `M : N`
  * **Meaning:** A specific flight instance (the aggregated manifest) uses many (`N`) munitions, and a specific munition can be assigned across many (`M`) flight instances.