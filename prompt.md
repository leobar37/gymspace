# Check-in Flow - MVP Implementation Sequence

## **Pre-Implementation Checklist**
- [ ] Verify Check_ins entity exists in database schema
- [ ] Confirm Gym_Clients entity has necessary fields (status, contracts)
- [ ] Ensure proper relationships between entities are established
- [ ] Review RequestContext pattern for gym-specific operations

---

## **SEQUENCE 1: Backend API Implementation**

### **Step 1.1: Create Check-in DTOs**
- [ ] Create `CreateCheckInDto` with validation decorators
- [ ] Create `CheckInResponseDto` for API responses
- [ ] Create `CheckInListQueryDto` for filtering/pagination
- [ ] Add Swagger documentation to all DTOs

### **Step 1.2: Implement Check-ins Service**
- [ ] Create `CheckInsService` with business logic
- [ ] Implement `createCheckIn()` method with validations
- [ ] Implement `findByGym()` method with pagination
- [ ] Implement `findByClient()` method for client history
- [ ] Implement `getCurrentlyInGym()` method for active users
- [ ] Add client membership validation logic
- [ ] Add contract expiration checks
- [ ] Throw appropriate exceptions for invalid states

### **Step 1.3: Create Check-ins Controller**
- [ ] Create `CheckInsController` with proper decorators
- [ ] Implement `POST /check-ins` endpoint
- [ ] Implement `GET /check-ins` endpoint with pagination
- [ ] Implement `GET /check-ins/current` for currently in gym
- [ ] Implement `GET /check-ins/client/:clientId` for client history
- [ ] Add `@Allow()` permissions for each endpoint
- [ ] Add comprehensive Swagger documentation
- [ ] Inject and use `RequestContext` properly

### **Step 1.4: Client Search Endpoints**
- [ ] Create `GET /clients/search` endpoint for check-in search
- [ ] Support search by name, client number, document ID
- [ ] Return client status and membership validity
- [ ] Include contract information in response
- [ ] Add proper error handling for no results

---

## **SEQUENCE 2: Manual SDK Implementation**

### **Step 2.1: Create Check-ins API Class**
- [ ] Create `CheckInsAPI` class in SDK
- [ ] Implement `create(data)` method
- [ ] Implement `list(params)` method
- [ ] Implement `getCurrentlyInGym()` method
- [ ] Implement `getClientHistory(clientId)` method

### **Step 2.2: Create Client Search API**
- [ ] Add `search(query)` method to `ClientsAPI`
- [ ] Return search results with membership status
- [ ] Include contract validity information

### **Step 2.3: Define TypeScript Types**
- [ ] Create `CheckIn` interface
- [ ] Create `CreateCheckInData` interface
- [ ] Create `CheckInListParams` interface
- [ ] Create `ClientSearchResult` interface
- [ ] Create `CurrentlyInGymResponse` interface

### **Step 2.4: Update SDK Exports**
- [ ] Add check-ins types to SDK exports
- [ ] Add CheckInsAPI to main GymSpaceSdk class
- [ ] Update SDK index.ts with new exports

---

## **SEQUENCE 3: Frontend Controllers**

### **Step 3.1: Create Check-ins Controller**
- [ ] Create `useCheckInsController` hook
- [ ] Implement check-in creation mutation
- [ ] Implement check-ins list query with pagination
- [ ] Implement currently in gym query
- [ ] Implement client history query
- [ ] Add proper cache invalidation strategies
- [ ] Handle loading and error states

### **Step 3.2: Create Client Search Controller**
- [ ] Create `useClientSearchController` hook
- [ ] Implement client search query with debouncing
- [ ] Include membership validation in results
- [ ] Add search result caching strategy

### **Step 3.3: Create Check-in State Management**
- [ ] Create Jotai atoms for check-in form state
- [ ] Create atom for selected client
- [ ] Create atom for search query
- [ ] Create derived atoms for validation states

---

## **SEQUENCE 4: UI Components**

### **Step 4.1: Client Search Component**
- [ ] Create `ClientSearchInput` component
- [ ] Add debounced search functionality
- [ ] Display search results with client info
- [ ] Show membership status indicators
- [ ] Handle "no results found" state
- [ ] Add loading spinner during search

### **Step 4.2: Client Selection Component**
- [ ] Create `ClientCard` component for search results
- [ ] Display client photo, name, number
- [ ] Show membership status badge
- [ ] Display last visit information
- [ ] Add check-in button with validation
- [ ] Handle expired membership state

### **Step 4.3: Check-in Form Component**
- [ ] Create `CheckInForm` component
- [ ] Integrate client search
- [ ] Add optional notes field
- [ ] Show client validation results
- [ ] Handle success/error feedback
- [ ] Add confirmation dialog for check-in

### **Step 4.4: Check-in Dashboard Component**
- [ ] Create `CheckInDashboard` component
- [ ] Display today's statistics
- [ ] Show currently in gym count
- [ ] List recent check-ins
- [ ] Add quick search functionality

### **Step 4.5: Special Cases Components**
- [ ] Create `ExpiredMembershipDialog` component
- [ ] Create `ClientNotFoundDialog` component
- [ ] Create `CheckInSuccessDialog` component
- [ ] Add options for each special case
- [ ] Implement proper navigation flows

---

## **SEQUENCE 5: Error Handling & User Feedback**

### **Step 5.1: Error States**
- [ ] Handle client not found errors
- [ ] Handle expired membership errors
- [ ] Handle suspended client errors
- [ ] Handle network/API errors
- [ ] Add retry mechanisms where appropriate

### **Step 5.2: Success Feedback**
- [ ] Show check-in success notification
- [ ] Display client visit statistics
- [ ] Update UI state immediately
- [ ] Provide navigation options after check-in

### **Step 5.3: Loading States**
- [ ] Add search loading indicators
- [ ] Add check-in processing loaders
- [ ] Show skeleton screens for data loading
- [ ] Disable buttons during operations

---

## **SEQUENCE 6: Validation & Business Logic**

### **Step 6.1: Client Validation**
- [ ] Verify client has active contract
- [ ] Check contract expiration date
- [ ] Validate client status (active/suspended)
- [ ] Check plan limits if applicable

### **Step 6.2: Permission Validation**
- [ ] Verify user has check-in permissions
- [ ] Check gym access rights
- [ ] Validate staff role requirements

### **Step 6.3: Data Integrity**
- [ ] Prevent duplicate check-ins
- [ ] Validate timestamp accuracy
- [ ] Ensure proper audit trail
- [ ] Handle edge cases gracefully

---

## **SEQUENCE 7: Reports & Dashboard**

### **Step 7.1: Basic Reports**
- [ ] Implement daily check-in count
- [ ] Show peak hours statistics
- [ ] Display most frequent clients
- [ ] Add monthly visit trends

### **Step 7.2: Real-time Updates**
- [ ] Update currently in gym count
- [ ] Refresh recent check-ins list
- [ ] Update statistics automatically

---

**Implementation Priority:** 
1. **High:** Sequences 1-3 (Core functionality)
2. **Medium:** Sequences 4-5 (User interface)  
3. **Low:** Sequences 6-7 (Enhancement features)

**Estimated Timeline:** 2-3 weeks for MVP implementation