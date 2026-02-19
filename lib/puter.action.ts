import { puter } from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

const PROJECT_PREFIX = "roomify-projects_";

const isOnPuter = () =>
  typeof window !== "undefined" &&
  window.location.hostname.endsWith(".puter.site");

const workerFetch = (url: string, init?: RequestInit): Promise<Response> => {
  if (isOnPuter()) {
    return puter.workers.exec(url, init) as Promise<Response>;
  }
  const proxyUrl = url.replace(PUTER_WORKER_URL, "/worker-api");
  return fetch(proxyUrl, init);
};

const kvSaveProject = async (project: DesignItem): Promise<DesignItem> => {
  const payload = { ...project, updatedAt: new Date().toISOString() };
  await puter.kv.set(`${PROJECT_PREFIX}${project.id}`, payload);
  return payload as DesignItem;
};

const kvListProjects = async (): Promise<DesignItem[]> => {
  const keys = (await puter.kv.list({ pattern: `${PROJECT_PREFIX}*` })) as
    | string[]
    | null;
  if (!keys?.length) return [];
  const items = await Promise.all(keys.map((k: string) => puter.kv.get(k)));
  return (items.filter(Boolean) as DesignItem[]).sort(
    (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
  );
};

const kvGetProject = async (id: string): Promise<DesignItem | null> => {
  const item = (await puter.kv.get(
    `${PROJECT_PREFIX}${id}`,
  )) as DesignItem | null;
  return item ?? null;
};

export const signIn = async () => await puter.auth.signIn();
export const signOut = async () => puter.auth.signOut();

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
};

export const createProjectUser = async ({
  item,
  visibility = "private",
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  const projectId = item.id;

  const hosting = await getOrCreateHostingConfig();

  const hostedSource = projectId
    ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source",
      })
    : null;

  const hostedRender =
    projectId && item.renderedImage
      ? await uploadImageToHosting({
          hosting,
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;

  const resolvedSource =
    hostedSource?.url ||
    (isHostedUrl(item.sourceImage) ? item.sourceImage : "");

  if (!resolvedSource) {
    console.warn("Failed to host source image, skipping save.");
    return null;
  }

  const resolvedRender = hostedRender?.url
    ? hostedRender.url
    : item.renderedImage && isHostedUrl(item.renderedImage)
      ? item.renderedImage
      : undefined;

  const {
    sourcePath: _sourcePath,
    renderedPath: _renderedPath,
    publicPath: _publicPath,
    ...rest
  } = item;

  const payload: DesignItem = {
    ...rest,
    sourceImage: resolvedSource,
    renderedImage: resolvedRender,
  };

  // ── Dev mode: bypass worker, use puter.kv directly ──
  if (!isOnPuter()) {
    try {
      return await kvSaveProject(payload);
    } catch (e) {
      console.error("Dev: failed to save project to kv", e);
      return null;
    }
  }

  // ── Production: use worker ──
  if (!PUTER_WORKER_URL) {
    console.warn("MISSING VITE_PUTER_WORKER; skip save");
    return null;
  }

  try {
    const response = await workerFetch(
      `${PUTER_WORKER_URL}/api/projects/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: payload, visibility }),
      },
    );

    if (!response.ok) {
      console.error("failed to save project", await response.text());
      return null;
    }

    const data = (await response.json()) as { project?: DesignItem };
    return data.project || null;
  } catch (e) {
    console.error("failed to save project", e);
    return null;
  }
};

export const updateProjectRender = async (
  id: string,
  renderedImage: string,
): Promise<void> => {
  if (!isOnPuter()) {
    try {
      const existing = await kvGetProject(id);
      if (existing) {
        await kvSaveProject({ ...existing, renderedImage });
      }
    } catch (e) {
      console.warn("Dev: failed to update render in kv", e);
    }
    return;
  }
  try {
    const response = await workerFetch(
      `${PUTER_WORKER_URL}/api/projects/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: { id, renderedImage } }),
      },
    );
    if (!response.ok)
      console.warn("Failed to update render in production worker");
  } catch (e) {
    console.warn("Failed to update render", e);
  }
};

export const getProjects = async (): Promise<DesignItem[]> => {
  // ── Dev mode: bypass worker ──
  if (!isOnPuter()) {
    try {
      return await kvListProjects();
    } catch (e) {
      console.error("Dev: failed to list projects from kv", e);
      return [];
    }
  }

  // ── Production: use worker ──
  if (!PUTER_WORKER_URL) {
    console.warn("MISSING VITE_PUTER_WORKER; skip history fetch");
    return [];
  }

  try {
    const response = await workerFetch(`${PUTER_WORKER_URL}/api/projects/list`);

    if (!response.ok) {
      console.error("Failed to fetch history", await response.text());
      return [];
    }

    const data = (await response.json()) as { projects?: DesignItem[] };
    return Array.isArray(data?.projects) ? data.projects : [];
  } catch (e) {
    console.error("Failed to fetch projects", e);
    return [];
  }
};

export const getProjectById = async (
  id: string,
): Promise<DesignItem | null> => {
  // ── Dev mode: bypass worker ──
  if (!isOnPuter()) {
    try {
      return await kvGetProject(id);
    } catch (e) {
      console.error("Dev: failed to get project from kv", e);
      return null;
    }
  }

  // ── Production: use worker ──
  if (!PUTER_WORKER_URL) {
    console.warn("MISSING VITE_PUTER_WORKER; skip project fetch");
    return null;
  }

  try {
    const response = await workerFetch(
      `${PUTER_WORKER_URL}/api/projects/get?id=${id}`,
    );

    if (!response.ok) {
      console.error("Failed to fetch project", await response.text());
      return null;
    }

    const data = (await response.json()) as { project?: DesignItem };
    return data.project || null;
  } catch (e) {
    console.error("Failed to fetch project", e);
    return null;
  }
};
