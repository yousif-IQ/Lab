import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'change-this-development-secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://webforge:webforge@localhost:5432/webforge' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '32kb' }));

const seed = [
  ['sqli-01','The Query Door','تجاوز تسجيل الدخول عبر حقن SQL بسيط.','web','WEB','EASY',100,'SQL INJECTION','اعثر على طريقة لتجاوز نموذج تسجيل الدخول والوصول إلى لوحة الإدارة.','جرّب التفكير في كيفية تعامل الاستعلام مع المدخلات غير الموثوقة.','WF{query_door_open}'],
  ['xss-01','Reflected Echo','اجعل التطبيق يعكس مدخلاتك في الصفحة.','web','WEB','EASY',100,'XSS','استغل الانعكاس غير الآمن لإظهار payload في سياق المتصفح.','قارن بين النص الذي تكتبه والنص الذي يعيده الخادم.','WF{echo_in_the_browser}'],
  ['auth-01','Broken Gate','صلاحيات غير صحيحة تفصل بين المستخدم والمدير.','auth','AUTH','EASY',150,'AUTH','اكتشف المسار الذي يسمح لمستخدم عادي برؤية مورد إداري.','الواجهة ليست مصدر الحقيقة الوحيد للصلاحيات.','WF{role_is_not_a_secret}'],
  ['api-01','IDOR: Private Notes','الوصول إلى ملاحظة مستخدم آخر عبر API.','api','API','MEDIUM',250,'IDOR','عدّل المعرّف في الطلب للوصول إلى مورد لا يخصك.','راقب المعرفات المتسلسلة في الطلبات.','WF{object_reference_found}'],
  ['ssrf-01','The Blind Postman','خادم داخلي يثق في عنوان URL الذي ترسله.','api','API','MEDIUM',300,'SSRF','اجعل الخدمة تطلب موردًا داخليًا غير ظاهر من الخارج.','فكّر في الخدمات التي لا يمكن للمتصفح الوصول إليها مباشرة.','WF{postman_reads_inside}'],
  ['jwt-01','Token Forgery','تحقق ضعيف من JSON Web Token.','auth','AUTH','MEDIUM',300,'JWT','افهم claims داخل التوكن واكتشف نقطة الضعف في التحقق.','التوقيع والبيانات شيئان مختلفان داخل JWT.','WF{signed_but_not_verified}'],
  ['path-01','Beyond The Path','تطبيق ملفات لا ينظف المسارات بشكل صحيح.','advanced','WEB','HARD',400,'PATH TRAVERSAL','اخرج من مجلد الملفات المسموح واقرأ الملف المطلوب.','المسار الذي يبدو آمنًا قد يتغير بعد التطبيع.','WF{dot_dot_beyond}'],
  ['deser-01','Untrusted Parcel','كائن serialized يصل إلى الخادم دون تحقق.','advanced','WEB','HARD',500,'DESERIALIZATION','حلّل بنية البيانات غير الموثوقة وحدد سلسلة الاستغلال.','لا تتعامل مع كل payload على أنه مجرد نص.','WF{parcel_was_untrusted}'],
  ['crapi-01','Wallet Switch','منطق أعمال مكسور في خدمة المحافظ.','api','API','HARD',450,'BUSINESS LOGIC','استغل اختلاف حالة الرصيد بين نقطتي API.','اختبر ترتيب العمليات، لا مدخلاتها فقط.','WF{logic_has_a_race}'],
  ['mutillidae-01','Mutillidae: First Contact','بوابة البداية إلى تطبيق PHP ضعيف متعدد المسارات.','web','WEB','EASY',100,'MUTILLIDAE II','حدد نقطة الإدخال الأقل حماية وسجّل أول Flag.','ابدأ من الصفحات التي تعرض مدخلات المستخدم.','WF{mutillidae_first_contact}'],
  ['dvwa-01','DVWA: Low Signal','مختبر تدريجي لفهم أساسيات الاستغلال.','web','WEB','EASY',100,'DVWA','استخرج القيمة المخفية من تحدي المستوى المنخفض.','افحص الطلب والاستجابة، وليس الواجهة فقط.','WF{dvwa_low_signal}'],
  ['bwapp-01','Bee in the Box','تطبيق bWAPP مع سلوك غير آمن في النماذج.','web','WEB','EASY',150,'BWAPP','استخدم مدخلًا مصممًا بعناية للوصول إلى النتيجة.','اختبر حدود التحقق من المدخلات.','WF{bee_in_the_box}'],
  ['juice-01','Juice Cart','تحدي متجر إلكتروني مليء بالمسارات المخفية.','web','WEB','MEDIUM',250,'JUICE SHOP','اكتشف endpoint غير موثق في واجهة المتجر.','ملفات JavaScript قد تكشف أكثر مما تتوقع.','WF{juice_cart_unlocked}'],
  ['webgoat-01','Goat Trail','درس تفاعلي يشرح الثغرة قبل أن يطلب استغلالها.','web','WEB','MEDIUM',250,'WEBGOAT','أكمل سلسلة الدرس وسجّل التحقق النهائي.','اقرأ ملاحظات الدرس، فهي جزء من التحدي.','WF{goat_trail_complete}'],
  ['tomcat-01','Manager on Port 8080','إعدادات خادم تكشف لوحة إدارة حساسة.','advanced','WEB','MEDIUM',300,'MISCONFIGURATION','حدد أثر الإعداد الخاطئ داخل المختبر.','الخدمات الإدارية لا يجب أن تكون مكشوفة افتراضيًا.','WF{manager_not_for_public}'],
  ['wrongsecrets-01','Secret in Plain Sight','أثر سري داخل إعداد أو artifact منسي.','advanced','WEB','MEDIUM',250,'SECRETS','اعثر على السر التجريبي وحدد مصدر التسريب.','ابحث في السجلات والملفات المضمنة.','WF{secret_in_plain_sight}'],
  ['shepherd-01','Shepherd’s Lesson','تحدي موجه حول التحقق من الصلاحيات.','auth','AUTH','MEDIUM',250,'SECURITY SHEPHERD','أكمل سيناريو الصلاحيات وسجل النتيجة.','المستخدم المصادق عليه ليس بالضرورة مستخدمًا مخولًا.','WF{shepherd_checked_the_role}'],
  ['dvws-01','Node Under Pressure','خدمة Node.js تكشف API غير موثق.','api','API','MEDIUM',300,'DVWS NODE','ارسم سطح API ثم اعثر على المسار المخفي.','راقب رسائل الخطأ وبنية الاستجابات.','WF{node_api_mapped}'],
  ['zerohealth-01','Patient Zero','بوابة صحية تجمع بين Web وAPI في رحلة واحدة.','api','API','HARD',400,'ZEROHEALTH','اربط بين تسريب الواجهة وطلب API للوصول إلى البيانات التجريبية.','التطبيق الأمامي ليس حدًا أمنيًا.','WF{patient_zero_found}'],
  ['restaurant-01','Order of Operations','RESTaurant API يختبر فهمك لتدفق الطلبات.','api','API','HARD',400,'REST API','استغل خللًا في منطق الطلب داخل المختبر.','تتبّع الحالة قبل وبعد كل عملية.','WF{order_of_operations}']
];

const publicChallenge = r => ({ id:r.id, title:r.title, desc:r.description, cat:r.category, type:r.type, difficulty:r.difficulty, points:r.points, tag:r.tag, objective:r.objective, hint:r.hint });
const tokenFor = user => jwt.sign({ sub:user.id, username:user.username }, jwtSecret, { expiresIn:'7d' });
async function query(text, params=[]){ return pool.query(text, params); }
async function init(){
  const schema = await fs.readFile(path.join(__dirname,'schema.sql'),'utf8');
  await query(schema);
  for (const c of seed) await query(`INSERT INTO challenges (id,title,description,category,type,difficulty,points,tag,objective,hint,flag_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, points=EXCLUDED.points, flag_hash=EXCLUDED.flag_hash`, [...c.slice(0,10), await bcrypt.hash(c[10], 10)]);
}
function auth(req,res,next){ try{ const raw=req.headers.authorization?.replace('Bearer ',''); if(!raw) return res.status(401).json({error:'Authentication required'}); req.user=jwt.verify(raw,jwtSecret); next(); }catch{return res.status(401).json({error:'Invalid or expired token'});} }

app.get('/api/health', async (_req,res)=>{ try{await query('SELECT 1');res.json({status:'ok',service:'webforge-api'});}catch{res.status(503).json({status:'error'});} });
app.get('/api/challenges', async (req,res)=>{ const {category}=req.query; const result=await query('SELECT id,title,description,category,type,difficulty,points,tag,objective,hint FROM challenges WHERE active=true '+(category?'AND category=$1 ':'')+'ORDER BY points,id',category?[category]:[]);res.json({data:result.rows.map(publicChallenge)}); });
app.post('/api/auth/register', async (req,res)=>{ const {username,email,password}=req.body||{};if(!username||!email||!password||password.length<8)return res.status(400).json({error:'username, email and password (8+ chars) are required'});try{const user={id:crypto.randomUUID(),username,email,password_hash:await bcrypt.hash(password,12)};await query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)',[user.id,user.username,user.email,user.password_hash]);res.status(201).json({token:tokenFor(user),user:{id:user.id,username:user.username,email:user.email}});}catch(e){res.status(e.code==='23505'?409:500).json({error:e.code==='23505'?'Username or email already exists':'Registration failed'});} });
app.post('/api/auth/login', async (req,res)=>{const {email,password}=req.body||{};const r=await query('SELECT * FROM users WHERE email=$1',[email]);if(!r.rowCount||!(await bcrypt.compare(password,r.rows[0].password_hash)))return res.status(401).json({error:'Invalid credentials'});const u=r.rows[0];res.json({token:tokenFor(u),user:{id:u.id,username:u.username,email:u.email}});});
app.get('/api/me',auth,async(req,res)=>{const r=await query('SELECT id,username,email,created_at FROM users WHERE id=$1',[req.user.sub]);res.json({user:r.rows[0]||null});});
app.get('/api/me/progress',auth,async(req,res)=>{const r=await query('SELECT c.id,c.title,c.points,s.solved_at FROM solves s JOIN challenges c ON c.id=s.challenge_id WHERE s.user_id=$1 ORDER BY s.solved_at DESC',[req.user.sub]);res.json({solved:r.rows,score:r.rows.reduce((n,x)=>n+x.points,0)});});
app.post('/api/challenges/:id/submit',auth,async(req,res)=>{const {flag}=req.body||{};const c=await query('SELECT id,points,flag_hash FROM challenges WHERE id=$1 AND active=true',[req.params.id]);if(!c.rowCount)return res.status(404).json({error:'Challenge not found'});if(!flag||!(await bcrypt.compare(flag.trim(),c.rows[0].flag_hash)))return res.status(400).json({correct:false,error:'Incorrect flag'});const inserted=await query('INSERT INTO solves (user_id,challenge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING challenge_id',[req.user.sub,req.params.id]);res.json({correct:true,newSolve:inserted.rowCount>0,points:inserted.rowCount?c.rows[0].points:0});});
app.get('/api/leaderboard',async(_req,res)=>{const r=await query(`SELECT u.username,COALESCE(SUM(c.points),0)::int AS score,COUNT(s.challenge_id)::int AS solved FROM users u LEFT JOIN solves s ON s.user_id=u.id LEFT JOIN challenges c ON c.id=s.challenge_id GROUP BY u.id ORDER BY score DESC, solved DESC, u.username LIMIT 50`);res.json({data:r.rows});});
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
init().then(()=>app.listen(port,()=>console.log(`WebForge API listening on :${port}`))).catch(err=>{console.error(err);process.exit(1)});
