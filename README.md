# WebForge CTF

واجهة CTF عربية متخصصة في أمن تطبيقات الويب وواجهات API، مستوحاة من مجموعة OWASP AttackForge وبطابع operator console قريب من منصات التدريب الهجومي الحديثة.

**Made by Yousif Wazni**

## التشغيل

افتح `index.html` مباشرة في المتصفح. لا تحتاج إلى تثبيت أو خادم.

## تشغيل المنصة كاملة عبر Docker

يتطلب Docker Desktop مع Compose. جهّز الإعدادات المحلية أولًا:

```bash
copy .env.example .env
```

ثم غيّر قيم `POSTGRES_PASSWORD` و`JWT_SECRET` داخل `.env`.

```bash
docker compose up --build -d
```

بعد التشغيل:

- الواجهة: `http://localhost:8080`
- API: `http://localhost:4000/api/health`
- قاعدة البيانات: PostgreSQL داخل شبكة Docker فقط

لإيقاف الخدمات:

```bash
docker compose down
```

تُنشئ الخدمة الجداول وتزرع التحديات تلقائيًا عند التشغيل الأول. غيّر `JWT_SECRET` وكلمة مرور PostgreSQL قبل أي نشر خارجي.

### API الأساسي

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/challenges`
- `POST /api/challenges/:id/submit` مع Bearer token
- `GET /api/me/progress` مع Bearer token
- `GET /api/leaderboard`

## ما تم بناؤه

- لوحة تحكم بتقدم المستخدم والنقاط والتحديات المحلولة.
- كتالوج تحديات يغطي التطبيقات الرئيسية في AttackForge: Mutillidae، DVWA، bWAPP، Juice Shop، WebGoat، Tomcat، WrongSecrets، Security Shepherd، DVWS، ZeroHealth وRESTaurant، إضافة إلى SQL Injection، XSS، Auth، IDOR، SSRF، JWT، Path Traversal، Deserialization وBusiness Logic.
- بحث وفلاتر حسب Web / API / Auth / Advanced.
- نافذة تحدي مع المهمة، التلميح، والتحقق من Flag.
- تخزين التقدم في `localStorage`.
- لوحة متصدرين ومسار تدريبي.
- تصميم Responsive يدعم العربية واتجاه RTL.

## ملاحظة مهمة

هذه نسخة Frontend/Prototype محلية. الـFlags تجريبية وموجودة داخل `app.js` لأغراض العرض. لتحويلها إلى منصة حقيقية، يلزم Backend مع Docker targets معزولة، قاعدة بيانات للمستخدمين والنتائج، ونظام تحقق Flags على الخادم.
