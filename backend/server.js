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
const jwtSecret = process.env.JWT_SECRET || 'development-only-secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://labforge:labforge@localhost:5432/labforge' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '32kb' }));

const seed = [
  ['sqli-01','The Query Door','Bypass a login form with a simple SQL injection.','web','WEB','EASY',100,'SQL INJECTION','Find a way to bypass the login form and reach the admin panel.','Think about how the query handles untrusted input.','WF{query_door_open}'],
  ['xss-01','Reflected Echo','Make the application reflect your input in the page.','web','WEB','EASY',100,'XSS','Use an unsafe reflection to execute a payload in the browser context.','Compare what you submit with what the server sends back.','WF{echo_in_the_browser}'],
  ['auth-01','Broken Gate','Incorrect authorization separates users from administrators.','auth','AUTH','EASY',150,'AUTH','Find the route that lets a normal user access an administrative resource.','The frontend is not the source of truth for authorization.','WF{role_is_not_a_secret}'],
  ['api-01','IDOR: Private Notes','Access another user’s note through an API.','api','API','MEDIUM',250,'IDOR','Change the object identifier to access a resource that is not yours.','Watch for predictable identifiers in requests.','WF{object_reference_found}'],
  ['ssrf-01','The Blind Postman','An internal service trusts the URL you provide.','api','API','MEDIUM',300,'SSRF','Make the service request an internal resource that is not exposed externally.','Think about services the browser cannot reach directly.','WF{postman_reads_inside}'],
  ['jwt-01','Token Forgery','Weak validation of a JSON Web Token.','auth','AUTH','MEDIUM',300,'JWT','Inspect the token claims and identify the validation weakness.','The signature and the claims are different parts of a JWT.','WF{signed_but_not_verified}'],
  ['path-01','Beyond The Path','A file application does not normalize paths safely.','advanced','WEB','HARD',400,'PATH TRAVERSAL','Leave the allowed directory and read the requested file.','A path that looks safe can change after normalization.','WF{dot_dot_beyond}'],
  ['deser-01','Untrusted Parcel','A serialized object reaches the server without validation.','advanced','WEB','HARD',500,'DESERIALIZATION','Analyze the untrusted data structure and identify the exploit chain.','Do not treat every payload as plain text.','WF{parcel_was_untrusted}'],
  ['crapi-01','Wallet Switch','Broken business logic in a wallet service.','api','API','HARD',450,'BUSINESS LOGIC','Exploit a mismatch between wallet state and API operations.','Test operation order, not only operation input.','WF{logic_has_a_race}'],
  ['mutillidae-01','Mutillidae: First Contact','A multi-path PHP lab for your first assessment.','web','WEB','EASY',100,'MUTILLIDAE II','Find the least protected input and capture your first flag.','Start with pages that display user-controlled input.','WF{mutillidae_first_contact}'],
  ['dvwa-01','DVWA: Low Signal','A guided lab for exploitation fundamentals.','web','WEB','EASY',100,'DVWA','Extract the hidden value from the low-level challenge.','Inspect the request and response, not only the page.','WF{dvwa_low_signal}'],
  ['bwapp-01','Bee in the Box','A bWAPP form with unsafe input handling.','web','WEB','EASY',150,'BWAPP','Use a carefully crafted input to reach the result.','Test the boundaries of input validation.','WF{bee_in_the_box}'],
  ['juice-01','Juice Cart','An e-commerce challenge filled with hidden routes.','web','WEB','MEDIUM',250,'JUICE SHOP','Discover an undocumented endpoint in the store frontend.','JavaScript bundles can reveal more than expected.','WF{juice_cart_unlocked}'],
  ['webgoat-01','Goat Trail','A guided lesson that explains the bug before the exploit.','web','WEB','MEDIUM',250,'WEBGOAT','Complete the lesson chain and capture the final validation.','The lesson notes are part of the challenge.','WF{goat_trail_complete}'],
  ['tomcat-01','Manager on Port 8080','Server settings expose a sensitive management panel.','advanced','WEB','MEDIUM',300,'MISCONFIGURATION','Identify the impact of the unsafe configuration inside the lab.','Administrative services should not be public by default.','WF{manager_not_for_public}'],
  ['wrongsecrets-01','Secret in Plain Sight','A secret is left inside a forgotten configuration artifact.','advanced','WEB','MEDIUM',250,'SECRETS','Find the demo secret and identify its source.','Search logs and embedded files.','WF{secret_in_plain_sight}'],
  ['shepherd-01','Shepherd’s Lesson','A guided challenge about authorization checks.','auth','AUTH','MEDIUM',250,'SECURITY SHEPHERD','Complete the authorization scenario and record the result.','An authenticated user is not automatically authorized.','WF{shepherd_checked_the_role}'],
  ['dvws-01','Node Under Pressure','A Node.js service exposes an undocumented API.','api','API','MEDIUM',300,'DVWS NODE','Map the API surface and find the hidden route.','Watch error messages and response shapes.','WF{node_api_mapped}'],
  ['zerohealth-01','Patient Zero','A health portal connects a web journey to an API.','api','API','HARD',400,'ZEROHEALTH','Chain a frontend leak with an API request to reach demo data.','The frontend is not a security boundary.','WF{patient_zero_found}'],
  ['restaurant-01','Order of Operations','A RESTaurant API tests your understanding of request flow.','api','API','HARD',400,'REST API','Exploit a logic flaw in the order workflow inside the lab.','Track state before and after every operation.','WF{order_of_operations}']
];
const publicChallenge = row => ({ id:row.id,title:row.title,desc:row.description,cat:row.category,type:row.type,difficulty:row.difficulty,points:row.points,tag:row.tag,objective:row.objective,hint:row.hint });
const tokenFor = user => jwt.sign({ sub:user.id, username:user.username }, jwtSecret, { expiresIn:'7d' });
const query = (text, params=[]) => pool.query(text, params);
async function init(){const schema=await fs.readFile(path.join(__dirname,'schema.sql'),'utf8');await query(schema);for(const challenge of seed){await query(`INSERT INTO challenges (id,title,description,category,type,difficulty,points,tag,objective,hint,flag_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,points=EXCLUDED.points,flag_hash=EXCLUDED.flag_hash`,[...challenge.slice(0,10),await bcrypt.hash(challenge[10],10)])}}
function auth(req,res,next){try{const raw=req.headers.authorization?.replace('Bearer ','');if(!raw)return res.status(401).json({error:'Authentication required'});req.user=jwt.verify(raw,jwtSecret);next()}catch{return res.status(401).json({error:'Invalid or expired token'})}}
app.get('/api/health',async(_req,res)=>{try{await query('SELECT 1');res.json({status:'ok',service:'labforge-api'})}catch{res.status(503).json({status:'error'})}});
app.get('/api/challenges',async(req,res)=>{const category=req.query.category;const result=await query('SELECT id,title,description,category,type,difficulty,points,tag,objective,hint FROM challenges WHERE active=true '+(category?'AND category=$1 ':'')+'ORDER BY points,id',category?[category]:[]);res.json({data:result.rows.map(publicChallenge)})});
app.post('/api/auth/register',async(req,res)=>{const {username,email,password}=req.body||{};if(!username||!email||!password||password.length<8)return res.status(400).json({error:'username, email and an 8+ character password are required'});try{const user={id:crypto.randomUUID(),username,email,password_hash:await bcrypt.hash(password,12)};await query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)',[user.id,user.username,user.email,user.password_hash]);res.status(201).json({token:tokenFor(user),user:{id:user.id,username:user.username,email:user.email}})}catch(error){res.status(error.code==='23505'?409:500).json({error:error.code==='23505'?'Username or email already exists':'Registration failed'})}});
app.post('/api/auth/login',async(req,res)=>{const {email,password}=req.body||{},result=await query('SELECT * FROM users WHERE email=$1',[email]);if(!result.rowCount||!(await bcrypt.compare(password,result.rows[0].password_hash)))return res.status(401).json({error:'Invalid credentials'});const user=result.rows[0];res.json({token:tokenFor(user),user:{id:user.id,username:user.username,email:user.email}})});
app.get('/api/me',auth,async(req,res)=>{const result=await query('SELECT id,username,email,created_at FROM users WHERE id=$1',[req.user.sub]);res.json({user:result.rows[0]||null})});
app.get('/api/me/progress',auth,async(req,res)=>{const result=await query('SELECT c.id,c.title,c.points,s.solved_at FROM solves s JOIN challenges c ON c.id=s.challenge_id WHERE s.user_id=$1 ORDER BY s.solved_at DESC',[req.user.sub]);res.json({solved:result.rows,score:result.rows.reduce((total,row)=>total+row.points,0)})});
app.post('/api/challenges/:id/submit',auth,async(req,res)=>{const {flag}=req.body||{},result=await query('SELECT id,points,flag_hash FROM challenges WHERE id=$1 AND active=true',[req.params.id]);if(!result.rowCount)return res.status(404).json({error:'Challenge not found'});if(!flag||!(await bcrypt.compare(flag.trim(),result.rows[0].flag_hash)))return res.status(400).json({correct:false,error:'Incorrect flag'});const inserted=await query('INSERT INTO solves (user_id,challenge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING challenge_id',[req.user.sub,req.params.id]);res.json({correct:true,newSolve:inserted.rowCount>0,points:inserted.rowCount?result.rows[0].points:0})});
app.get('/api/leaderboard',async(_req,res)=>{const result=await query(`SELECT u.username,COALESCE(SUM(c.points),0)::int AS score,COUNT(s.challenge_id)::int AS solved FROM users u LEFT JOIN solves s ON s.user_id=u.id LEFT JOIN challenges c ON c.id=s.challenge_id GROUP BY u.id ORDER BY score DESC,solved DESC,u.username LIMIT 50`);res.json({data:result.rows})});
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
init().then(()=>app.listen(port,()=>console.log(`LabForge API listening on :${port}`))).catch(error=>{console.error(error);process.exit(1)});
