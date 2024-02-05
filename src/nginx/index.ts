import path from "path";
import { pb } from "../pocketbase/index.js";
import { writeStringToFile } from "../util/fileUtil.js";
import { chmodSync, copyFile, copyFileSync, fchmodSync } from "fs";
import { exec } from "child_process";

export const nginx = {
  async generateOutput() {
    console.log("Nginx: generate output");
    const instances = await pb.collection("instances").getFullList();

    let nginxConfig = "";
    nginxConfig += this.httpsRedirectBlock();
    nginxConfig += "\n";

    let nginxInstances = "";
    nginxInstances += this.instanceBlock("admin", 8000) + "\n";
    for (let instance of instances) {
      nginxInstances +=
        this.instanceBlock(instance.title, instance.activePORT) + "\n";
    }

    nginxConfig += this.httpsBlock(nginxInstances);
    const filePath= path.join(__dirname,"..", "..", "output-nginx", "nginx.conf")
    nginxConfig = `
    
events {
    worker_connections  4096;  ## Default: 1024
}

http {
      ${nginxConfig}
}`
    writeStringToFile(filePath, nginxConfig)
    console.log(`Copying nginx config`)
    console.log(`From: ${filePath}`)
    console.log(`To  : ${process.env.NGINX_CONF_PATH}`)

    //const fileDest= path.join(__dirname,"..", "..", "test_nginx", "nginx.conf")
    //console.log(`To2 : ${fileDest}`)

    copyFileSync(filePath,process.env.NGINX_CONF_PATH!)
    chmodSync(process.env.NGINX_CONF_PATH!, 777)
    console.log(`Nginx config copied successfully`)
    exec("nginx -s reload")
  },
  httpsRedirectBlock() {
    return `server {
        listen 80;
        server_name ${process.env.DOMAIN};
        server_tokens off;
    
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    
        location / {
            return 301 https://$host$request_uri;
        }
}`;
  },
  instanceBlock(title: string, port: number) {
    return `
        location /${title} {
                proxy_set_header Host $host;
                proxy_pass_request_headers on;
                proxy_set_header Connection "";
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $remote_addr;
                rewrite ^/${title}/(.*) /$1 break;
                proxy_pass http://127.0.0.1:${port}/;

                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
        }
`;
  },
  httpsBlock(instanceBlocks) {
    return `server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name ${process.env.DOMAIN};
    
        ssl_certificate ${process.env.CERT};
        ssl_certificate_key ${process.env.KEY};

        include snippets/ssl-params.conf;
    
${instanceBlocks}
}`;
  }
};
