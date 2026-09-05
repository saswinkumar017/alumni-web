# Runner Guide — Developer Role

## Prerequisites

- Java 21
- Node.js 18+
- MySQL 8.0+
- Maven (or use `./mvnw`)

## 1. Database Setup

```sql
CREATE DATABASE alumniweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Environment Variables

### Backend (`server/alumniweb/src/main/resources/application.properties`)

Already configured with defaults. Key values:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/alumniweb
spring.datasource.username=root
spring.datasource.password=mysql21

# JWT
app.jwt.secret=PY1+JYi80iVf1UVD5ZGywe3sRL0wEdwpjVvCHIUgKnzr+noh8cEcDT91wGdv7LVAFMbXd6gpppo0lG7USUPLAA==
app.jwt.issuer=alumniweb
app.jwt.access-token-expiration=900000       # 15 minutes
app.jwt.refresh-token-expiration=604800000   # 7 days

# Mail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=saswinkumar17@gmail.com
spring.mail.password=bmqo sacw yzjt vchn
```

**For production, move these to environment variables:**
```bash
export DB_USERNAME=root
export DB_PASSWORD=your_secure_password
export JWT_SECRET=your_256bit_secret_here
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_app_password
```

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_APP_NAME=JJCET Alumni
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
API_TIMEOUT_MS=30000
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token
LOG_LEVEL=info
```

## 3. Start Backend

```bash
cd server/alumniweb
./mvnw spring-boot:run
```

On first run, the DataSeeder will:
1. Create DEVELOPER user (`developer` / `Dev@123456789!`)
2. Seed 8 permission categories
3. Seed 74 permissions
4. Seed 3 role templates (ADMIN, USER, ALUMNI_LEAD)
5. Map all permissions to ADMIN role
6. Seed 5 platform configs
7. Seed 6 feature flags

## 4. Start Frontend

```bash
cd client
npm run dev
```

## 5. Login as Developer

1. Navigate to `http://localhost:3000/auth/login`
2. Enter:
   - **Username:** `developer`
   - **Password:** `Dev@123456789!`
3. You will be redirected to `http://localhost:3000/developer`

## 6. Developer Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | /developer | Platform overview |
| Configuration | /developer/platform/config | Platform settings |
| Feature Flags | /developer/platform/feature-flags | Toggle features |
| Roles | /developer/rbac/roles | Role template management |
| Permissions | /developer/rbac/permissions | Permission management |
| Users | /developer/users | User management |
| Sessions | /developer/sessions | Active sessions |
| Monitoring | /developer/monitoring | System health |
| Audit Logs | /developer/audit | Audit trail |
| CMS Pages | /developer/cms/pages | Page management |

## 7. Test API Endpoints

### Login
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"developer","password":"Dev@123456789!"}'
```

### Get Profile (with token)
```bash
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### List Feature Flags
```bash
curl http://localhost:8080/api/developer/feature-flags \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### List Users
```bash
curl http://localhost:8080/api/developer/users \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### System Health
```bash
curl http://localhost:8080/api/developer/monitoring/infrastructure \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## 8. Troubleshooting

### "DEVELOPER" role not found in enum
- Ensure `UserRole.java` has `DEVELOPER` value
- Restart backend after enum change

### Flyway migration fails
- Check MySQL version (8.0+ required)
- Ensure `alumniweb` database exists
- If upgrading from non-Flyway: set `spring.flyway.baseline-on-migrate=true`

### Login redirects back to login
- Check that `session_token` cookie is being set
- Check browser DevTools → Application → Cookies
- Verify JWT contains `role: "DEVELOPER"`

### Developer portal shows "Access Denied"
- Verify user has `role: DEVELOPER` in database
- Check `SecurityConfig.java` allows `/api/developer/**` for DEVELOPER role
- Check `proxy.ts` reads `user_role` cookie

### Feature flags not loading
- Check `/api/developer/feature-flags` returns data
- Verify DataSeeder ran (check `feature_flag` table has rows)
