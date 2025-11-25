# Curiosity Report: How k6 is actually running 
## JavaScript -> Go Runtime -> Load Engine -> Metrics Pipeline

## Why I Chose This Topic
Earliert we used **k6** to load-test the JWT Pizza service. We wrote JavaScript, ran it in the browser UI, and got graphs in Grafana. But I wanted to know more:

- k6 is written in **Go**, not JavaScript  
- But we write **JavaScript** test scripts  
- It creates **thousands** of virtual users without Node.js  
- It handles sync + async differently than normal JavaScript   

This report documents what I learned by digging into k6’s architecture, docs, GitHub repo, and developer blogs.

---

# What is k6 at a High Level?
k6 is a **load testing tool** built by Grafana Labs. Its tagline is:

> **Write JavaScript. Execute at Go speed.**

k6 is *not* a JS runtime.  
It’s a **Go runtime that just so happens to interpret JS**.

---

# How JavaScript Runs Inside a Go Program

k6 uses an embedded JS interpreter called **Goja**, which is:

- written entirely in Go  
- embeddable  
- deterministic  
- designed for sandboxing & performance  

When you run a k6 script, the CLI:

1. Loads the Goja engine  
2. Parses the JavaScript  
3. Compiles it to Go bytecode  
4. Executes it inside Go’s scheduler  

No Node.js.  
No V8.  
No event loop.

---

# How Virtual Users (VUs) Are Created

Each k6 Virtual User = a **goroutine**.

Goroutines are lightweight threads managed by Go, allowing k6 to simulate thousands of users without high overhead.

| Concept | Node.js | k6 |
|--------|---------|-----|
| Event Loop | Yes | No |
| Promises | Yes | No |
| VUs | Not real threads | Real goroutines |
| Concurrency | Limited | Massive |

---

# Sync vs Async Behavior in k6

k6 scripts are intentionally **blocking**:

- No promises  
- No async/await  
- No setTimeout  
- No event loop  

When JS calls `http.get()`, it blocks the VU while Go performs the underlying async I/O.

This creates:

- deterministic execution  
- reproducible load patterns  
- controlled arrival-rate load  

---

# Metrics, Checks, and Thresholds

Metrics pass through a pipeline in Go:

1. JS generates check/metric events  
2. Go aggregates them as counters, gauges, and trends  
3. Thresholds are continuously evaluated  
4. Metrics are exported to stdout, JSON, InfluxDB, or Grafana Cloud  

Thresholds like:

```js
http_req_duration: ["p(95)<500"]
```

are evaluated *during* the test, not after.

---

# Why k6 Isn’t Built on Node.js


- Node can’t create thousands of parallel JS contexts  
- V8 isolates are too heavy  
- k6 needs deterministic execution  
- Go provides massively scalable async networking  
- A single static binary is easier to distribute  

k6 is fundamentally a Go program with a JS interface.

---

# Experiments I Ran

I validated the architecture by:

### 1. Running 3000 VUs  
Memory stayed low which matches goroutine behavior.

### 2. Writing async JS  
It failed which confirms no event loop.

### 3. Causing threshold failures  
k6 aborted early which matches thresholds evaluated in real-time.

---

# What I Learned

- k6 is **Go with a JS front-end**  
- VUs = goroutines  
- JS is only a scripting interface  
- Async behavior is handled by Go  
- Metrics flow through a Go pipeline  
- Determinism is a core design goal  

---

# Why This Matters for DevOps

Understanding the boundary between the scripting layer and execution layer matters when:

- tuning VUs  
- analyzing latency  
- debugging load tests  
- reading Grafana dashboards  
- designing CI/CD performance gates  

It makes k6 much more predictable and useful.

---

# Conclusion

k6 is an great example of:

- Go concurrency  
- lightweight scripting  
- reproducible load generation  

This deep dive helped me understand how load-testing tools are built and why k6 is uniquely suited for real DevOps workflows.

