import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import { ArrowRight, ArrowUp, ArrowUpRight, Clock, Layers } from "lucide-react";
import { Button } from "../../components/ui/Button";
import Upload from "../../components/ui/Upload";
import { useNavigate } from "react-router";
import { useState } from "react";
import { createProjectUser } from "../../lib/puter.action";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DesignItem[]>([]);

  const handleUploadComplete = async (base64Image: string) => {
    const newId = Date.now().toString();
    const name = `Residence ${newId}`;

    const newItem = {
      id: newId,
      name,
      sourceImage: base64Image,
      renderedImage: undefined,
      timestamp: Date.now(),
    };

    const saved = await createProjectUser({ item: newItem, visibility: 'private' });

    if (!saved) {
      console.error('failed to create project');
      return false
    }

    setProjects((prev) => [newItem, ...prev]);

    sessionStorage.setItem(`roomify-upload-${newId}`, base64Image);

    navigate(`/visualize/${newId}`, {
      state: {
        initialImage: saved.sourceImage,
        initialRender: saved.renderedImage || null,
        name,
      }
    });
  };
  return (
    <div className="home">
      <Navbar />
      <section className="hero">
        <div className="announce">
          <div className="dot">
            <div className="pulse"></div>
          </div>

          <p>Introducing Roomify 2.0</p>
        </div>
        <h1>Build beautiful spaces at the speed of thought with roomify</h1>
        <p className="subtitle">
          Roomify is the ultimate tool for creating stunning 3D spaces with ease
          and speed. With our intuitive interface and powerful features, you can
          bring your ideas to life in no time.
        </p>

        <div className="actions">
          <Button variant="primary" size="lg" className="cta">
            START BUILDING <ArrowRight className="icon" />
          </Button>

          <Button variant="outline" size="lg" className="demo">
            WATCH DEMO
          </Button>
        </div>

        <div id="#upload" className="upload-shell">
          <div className="grid-overlay" />

          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers className="icon" />
              </div>

              <h3>Upload your floor plan</h3>
              <p>Support JPG, PNG, formats up to 10MB</p>
            </div>

            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>

      <section className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Projects</h2>
              <p>
                Your latest work and shared community projects, all in one
                place.
              </p>
            </div>
          </div>

          <div className="projects-grid">
            {projects.map(({id, name, renderedImage, sourceImage, timestamp}) => (
            <div key={id} className="project-card group">
              <div className="preview">
                <img
                  src={renderedImage || sourceImage}
                  alt={name || "Project"}
                />

                <div className="card-body">
                  <span>Community</span>
                </div>
              </div>

              <div className="card-body">
                <div>
                  <h3>{name}</h3>
                  <div className="meta">
                    <Clock size={12} />
                    <span>{new Date(timestamp).toLocaleDateString()}</span>
                    <span>By Jefta Supraja</span>
                  </div>
                </div>

                <div className="arrow">
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </div>

            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
