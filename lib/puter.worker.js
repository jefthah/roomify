const PROJECT_PREFIX = 'roomify-projects_';

const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({ error: message, ...extra }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.user.get()
        return user?.uuid || null
    } catch {
        return null
    }
}

router.post('/api/projects/save', async ({ request, response }) => {
    try {
        const userPuter = user.puter;

        if (!userPuter) return jsonError(401, 'Authentication failed');

        const body = await request.json();
        const project = body?.project;

        if (!project?.id || !project?.sourceImage) return jsonError(400, 'Missing required fields: id or sourceImage')

        const payload = {
            ...project,
            updatedAt: new Date().toISOString()
        }

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload }

    } catch (error) {
        return jsonError(500, "Failed to save project", { message: error.message || 'unknown error' })
    }
})

router.get('/api/projects/list', async ({ request }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const keys = await userPuter.kv.list();
        const projectKeys = keys.filter(key => key.startsWith(PROJECT_PREFIX));

        const projects = await Promise.all(projectKeys.map(key => userPuter.kv.get(key)));

        return { projects: projects.filter(Boolean) };
    } catch (error) {
        return jsonError(500, "Failed to list projects", { message: error.message || 'unknown error' });
    }
});

router.get('/api/projects/get', async ({ request }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, 'Project ID required');

        const project = await userPuter.kv.get(`${PROJECT_PREFIX}${id}`);

        if (!project) return jsonError(404, 'Project not found');

        return { project };
    } catch (error) {
        return jsonError(500, "Failed to get project", { message: error.message || 'unknown error' });
    }
});

router.get('/', () => {
    return new Response(JSON.stringify({
        status: 'ok',
        service: 'Roomify API',
        endpoints: [
            'POST /api/projects/save',
            'GET /api/projects/list',
            'GET /api/projects/get'
        ]
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
});
