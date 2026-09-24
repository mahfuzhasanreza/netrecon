| # | Scan              | Command                            | Finding                       |
| - | ----------------- | ---------------------------------- | ----------------------------- |
| 1 | **Quick**         | `-sn`, `-F`                        | Host + common ports           |
| 2 | **Full**          | `-p-`, `-sV`, `-O`                 | All TCP ports + services + OS  |
| 3 | **Stealth**       | `-sS -T1 --scan-delay 1s`          | Slow SYN-based TCP scan       |
| 4 | **UDP**           | `-sU -p-`                          | UDP ports/services            |
| 5 | **Vulnerability** | `-sV -sC`                          | Services + default NSE checks |
| 6 | **Web**           | `-p 80,443,8080,8443,3000 -sV -sC` | Common web ports/services     |
| 7 | **LAN Discovery** | `-sn`                              | Subnet's reachable hosts      |
