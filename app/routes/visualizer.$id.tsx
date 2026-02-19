import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useParams } from "react-router";

const Visualizer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useOutletContext<AuthContext>();
  const location = useLocation();
  const {
    initialImage,
    initialRender,
    name: initialName,
  } = (location.state as VisualizerLocationState) ?? {};

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const projectName = project?.name ?? initialName ?? "Untitled Project";

  const handleBack = () => navigate("/");

  const runGeneration = async (signal?: AbortSignal) => {
    if (!id || !initialImage) return;

    try {
      setIsProcessing(true);
      setRenderError(null);
      const result = await generate3DView({ sourceImage: initialImage });

      if (signal?.aborted) return;

      if (result && result.renderedImage) {
        setCurrentImage(result.renderedImage);
      }
    } catch (error) {
      if (signal?.aborted) return;
      const msg = error instanceof Error ? error.message : "Rendering failed";
      console.error("Generation Failed", error);
      setRenderError(msg);
    } finally {
      if (!signal?.aborted) {
        setIsProcessing(false);
      }
    }
  };

  const handleExport = () => {
    if (!currentImage) return;
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!currentImage) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectName, url: currentImage });
      } else {
        await navigator.clipboard.writeText(currentImage);
        alert("Image URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!initialImage || hasInitialGenerated.current) return;

    if (initialRender) {
      setCurrentImage(initialRender);
      hasInitialGenerated.current = true;
      return;
    }
    hasInitialGenerated.current = true;
    runGeneration(controller.signal);

    return () => {
      controller.abort();
    };
  }, [initialImage, initialRender]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />

          <span className="name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon" />
          Exit editor
        </Button>
      </nav>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Projects</p>
              {/* Bug #6 Fix: dynamic name + fixed typo */}
              <h2>{projectName}</h2>
              <p className="note"> Created by You</p>
            </div>

            <div className="panel-actions">
              <Button
                size="sm"
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button
                size="sm"
                onClick={handleShare}
                className="share"
                disabled={!currentImage}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI Render" className="render-img" />
            ) : (
              <div className="render-placeholder">
                {initialImage && (
                  <img
                    src={initialImage}
                    alt="Original"
                    className="render-fallback"
                  />
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering...</span>
                  <span className="subtitle">
                    This may take up to 90 seconds
                  </span>
                </div>
              </div>
            )}

            {renderError && !isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <span className="title render-error-title">
                    Rendering failed
                  </span>
                  <span className="subtitle">{renderError}</span>
                  <button
                    className="render-retry-btn"
                    onClick={() => {
                      hasInitialGenerated.current = false;
                      runGeneration();
                    }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Visualizer;
