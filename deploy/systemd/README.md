# systemd boot setup

These unit files make the current Prism stack start on server boot.

They intentionally do not reuse `scripts/prism_stack.sh`. That script launches background processes with `nohup`, which is convenient for local/manual use but prevents `systemd` from supervising each process directly.

## Before installing

Update these values in each unit if your host differs:

- `User=tokyo`
- `Group=tokyo`
- `/home/tokyo/Desktop/AIADS`
- the `ExecStart=` paths if Node or `cloudflared` are installed elsewhere

## Install

```bash
sudo cp deploy/systemd/prism-aiads-api.service /etc/systemd/system/
sudo cp deploy/systemd/prism-aiads-web.service /etc/systemd/system/
sudo cp deploy/systemd/prism-aiads-tunnel.service /etc/systemd/system/
sudo cp deploy/systemd/prism-aiads.target /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now prism-aiads.target
```

## Verify

```bash
sudo systemctl status prism-aiads-api.service
sudo systemctl status prism-aiads-web.service
sudo systemctl status prism-aiads-tunnel.service
```

## Host note

On this server, `cloudflared.service` and `cloudflared-stolenbikes.service` already exist for other tunnels. These Prism unit files use their own service names, so they should be installed alongside those units rather than replacing them.
