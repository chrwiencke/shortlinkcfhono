import { Hono } from 'hono'
const app = new Hono()

function validateURL(url) {
    if (!/^https?:\/\//.test(url)) {
        return "No http/https in URL";
    }
    if (!/^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(url)) {
        return "Invalid domain format";
    }
    return "URL is valid";
}

app.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const linkFromKV = await c.env.KV.get(id);

        if (!linkFromKV) {
            return c.html(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Error</title>
                </head>
                <body>
                    <div class="message error">Sorry this link does not exist</div>
                </body>
                </html>
            `)
        } else {
            return Response.redirect(linkFromKV, 307);
        }
    } catch (error) {
        console.error('Error handling redirect:', error);
        return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Error</title>
            </head>
            <body>
                <div class="message error">An error occurred</div>
            </body>
            </html>
        `, 500);
    }
})

app.post('/submit', async (c) => {
    try {
        const formData = await c.req.formData();

        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        const id = formObject['vanity'];
        const urlInput = formObject['url'];

        const urlValidationMessage = validateURL(urlInput);

        if (urlValidationMessage !== "URL is valid") {
            return c.html(`<div class="message error">${urlValidationMessage}</div>`);
        }

        const idAlreadyExists = await c.env.KV.get(id);

        if (idAlreadyExists !== null) {
            return c.html(`<div class="message error">${id} already exists.</div>`);
        }

        await c.env.KV.put(id, urlInput, { expirationTtl: 3600 });

        const hostname = c.req.url.split('/submit')[0];
        return c.html(`
            <div class="message success">
                ${id} successfully stored! Here is the link: 
                <a href="${hostname}/${id}">${hostname}/${id}</a>
            </div>
        `);
    } catch (error) {
        console.error('Error handling submission:', error);
        return c.html(`<div class="message error">An error occurred</div>`, 500);
    }
});

app.get('/', (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>URL Shortener</title>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <style>
        /* Base styles */
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        /* Form styles */
        form {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        input[type="text"] {
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        input[type="submit"] {
            background-color: #0066cc;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        input[type="submit"]:hover {
            background-color: #0052a3;
        }

        /* Message styles */
        .message {
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }

        .error {
            background-color: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }

        .success {
            background-color: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }

        /* Link styles */
        a {
            color: #0066cc;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <form hx-post="/submit" 
        hx-trigger="submit" 
        hx-target="#response" 
        hx-swap="innerHTML">
        <label for="vanity">Vanity:</label>
        <input type="text" id="vanity" name="vanity" required>
        <br>
        <label for="url">URL:</label>
        <input type="text" id="url" name="url" required>
        <br>
        <input type="submit" value="Submit">
    </form>

    <div id="response"></div>
</body>
</html>
`)
})

export default app