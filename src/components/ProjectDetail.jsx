import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, Github, Code2, Star,
  ChevronRight, Layers, Layout, Globe, Package, Cpu, Code,
} from "lucide-react";
import Swal from 'sweetalert2';

const TECH_ICONS = {
  React: Globe,
  Tailwind: Layout,
  Express: Cpu,
  Python: Code,
  Javascript: Code,
  HTML: Code,
  CSS: Code,
  default: Package,
};

const TechBadge = ({ tech }) => {
  const Icon = TECH_ICONS[tech] || TECH_ICONS["default"];
  
  return (
    <div className="group relative overflow-hidden px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-[var(--primary-red)]/10 to-pink-600/10 rounded-xl border border-[var(--primary-red)]/10 hover:border-[var(--primary-red)]/30 transition-all duration-300 cursor-default">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-red)]/0 to-pink-600/0 group-hover:from-[var(--primary-red)]/10 group-hover:to-pink-600/10 transition-all duration-500" />
      <div className="relative flex items-center gap-1.5 md:gap-2">
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--primary-red)] group-hover:text-pink-400 transition-colors" />
        <span className="text-xs md:text-sm font-medium text-pink-300/90 group-hover:text-pink-200 transition-colors">
          {tech}
        </span>
      </div>
    </div>
  );
};

const FeatureItem = ({ feature }) => {
  return (
    <li className="group flex items-start space-x-3 p-2.5 md:p-3.5 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-[var(--dark-border)]">
      <div className="relative mt-2">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary-red)]/20 to-pink-600/20 rounded-full blur group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
        <div className="relative w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-[var(--primary-red)] to-pink-600 group-hover:scale-125 transition-transform duration-300" />
      </div>
      <span className="text-sm md:text-base text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        {feature}
      </span>
    </li>
  );
};

const ProjectStats = ({ project }) => {
  const techStackCount = project?.TechStack?.length || 0;
  const featuresCount = project?.Features?.length || 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-[var(--dark-bg)] rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-red)]/10 to-pink-700/10 opacity-50 blur-2xl z-0" />

      <div className="relative z-10 flex items-center space-x-2 md:space-x-3 bg-white/5 p-2 md:p-3 rounded-lg border border-[var(--primary-red)]/20 transition-all duration-300 hover:scale-105 hover:border-[var(--primary-red)]/50 hover:shadow-lg">
        <div className="bg-[var(--primary-red)]/20 p-1.5 md:p-2 rounded-full">
          <Code2 className="text-[var(--primary-red)] w-4 h-4 md:w-6 md:h-6" strokeWidth={1.5} />
        </div>
        <div className="flex-grow">
          <div className="text-lg md:text-xl font-semibold text-pink-200">{techStackCount}</div>
          <div className="text-[10px] md:text-xs text-[var(--text-secondary)]/70">Total Technology</div>
        </div>
      </div>

      <div className="relative z-10 flex items-center space-x-2 md:space-x-3 bg-white/5 p-2 md:p-3 rounded-lg border border-pink-600/20 transition-all duration-300 hover:scale-105 hover:border-pink-600/50 hover:shadow-lg">
        <div className="bg-pink-600/20 p-1.5 md:p-2 rounded-full">
          <Layers className="text-pink-400 w-4 h-4 md:w-6 md:h-6" strokeWidth={1.5} />
        </div>
        <div className="flex-grow">
          <div className="text-lg md:text-xl font-semibold text-pink-200">{featuresCount}</div>
          <div className="text-[10px] md:text-xs text-[var(--text-secondary)]/70">Main Features</div>
        </div>
      </div>
    </div>
  );
};

const handleGithubClick = (githubLink) => {
  if (githubLink === 'Private') {
    Swal.fire({
      icon: 'info',
      title: 'Source Code Private',
      text: 'Maaf, source code untuk proyek ini bersifat privat.',
      confirmButtonText: 'Mengerti',
      confirmButtonColor: '#e11d48', // var(--primary-red)
      background: '#070014',         // var(--dark-bg)
      color: '#fdf2f8',              // var(--text-primary)
      iconColor: '#e11d48',          // match accent color
    });
    return false;
  }
  return true;
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const storedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const selectedProject = storedProjects.find((p) => String(p.id) === id);
    
    if (selectedProject) {
      const enhancedProject = {
        ...selectedProject,
        Features: selectedProject.Features || [],
        TechStack: selectedProject.TechStack || [],
        Github: selectedProject.Github || 'https://github.com/EkiZR',
      };
      setProject(enhancedProject);
    }
  }, [id]);

  if (!project) {
  return (
    <div className="min-h-screen bg-[#070014] flex items-center justify-center">
      <div className="text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto border-4 border-[#e11d48]/30 border-t-[#e11d48] rounded-full animate-spin" />
        <h2 className="text-xl md:text-3xl font-bold text-[#fdf2f8]">
          Loading Project...
        </h2>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#070014] px-[2%] sm:px-0 relative overflow-hidden">
      {/* Background blobs — crimson-themed */}
      <div className="fixed inset-0">
        <div className="absolute -inset-[10px] opacity-20">
          <div className="absolute top-0 -left-4 w-72 md:w-96 h-72 md:h-96 bg-[#e11d48] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 md:w-96 h-72 md:h-96 bg-[#f87171] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 md:w-96 h-72 md:h-96 bg-[#fb7185] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="flex items-center space-x-2 md:space-x-4 mb-8 md:mb-12 animate-fadeIn">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center space-x-1.5 md:space-x-2 px-3 md:px-5 py-2 md:py-2.5 bg-white/5 backdrop-blur-xl rounded-xl text-[#fdf2f8]/90 hover:bg-white/10 transition-all duration-300 border border-[#2a1919] hover:border-[#e11d48]/30 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-1 md:space-x-2 text-sm md:text-base text-[#cbd5e1]/60">
            <span>Projects</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-[#fdf2f8]/90 truncate">{project.Title}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16">
          {/* LEFT COLUMN */}
          <div className="space-y-6 md:space-y-10 animate-slideInLeft">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-6xl font-bold bg-gradient-to-r from-[#fdf2f8] via-[#e11d48] to-[#fb7185] bg-clip-text text-transparent leading-tight">
                {project.Title}
              </h1>
              <div className="relative h-1 w-16 md:w-24">
                <div className="absolute inset-0 bg-gradient-to-r from-[#e11d48] to-[#fb7185] rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#e11d48] to-[#fb7185] rounded-full blur-sm" />
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-base md:text-lg text-[#cbd5e1]/90 leading-relaxed">
                {project.Description}
              </p>
            </div>

            <ProjectStats project={project} />

            <div className="flex flex-wrap gap-3 md:gap-4">
              {/* Live Demo button */}
              <a
                href={project.Link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center space-x-1.5 md:space-x-2 px-4 md:px-8 py-2.5 md:py-4 bg-gradient-to-r from-[#e11d48]/10 to-[#fb7185]/10 hover:from-[#e11d48]/20 hover:to-[#fb7185]/20 text-[#fdf2f8]/90 rounded-xl transition-all duration-300 border border-[#e11d48]/20 hover:border-[#e11d48]/40 backdrop-blur-xl overflow-hidden text-sm md:text-base"
              >
                <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-[#e11d48]/10 to-[#fb7185]/10 transition-transform duration-300 group-hover:translate-y-[0%]" />
                <ExternalLink className="relative w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                <span className="relative font-medium">Live Demo</span>
              </a>

              {/* Github button */}
              <a
                href={project.Github}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center space-x-1.5 md:space-x-2 px-4 md:px-8 py-2.5 md:py-4 bg-gradient-to-r from-[#fb7185]/10 to-[#e11d48]/10 hover:from-[#fb7185]/20 hover:to-[#e11d48]/20 text-[#fdf2f8]/90 rounded-xl transition-all duration-300 border border-[#e11d48]/20 hover:border-[#e11d48]/40 backdrop-blur-xl overflow-hidden text-sm md:text-base"
                onClick={(e) => !handleGithubClick(project.Github) && e.preventDefault()}
              >
                <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-[#fb7185]/10 to-[#e11d48]/10 transition-transform duration-300 group-hover:translate-y-[0%]" />
                <Github className="relative w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                <span className="relative font-medium">Github</span>
              </a>
            </div>

            {/* Tech Stack Section */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold text-[#fdf2f8]/90 mt-[3rem] md:mt-0 flex items-center gap-2 md:gap-3">
                <Code2 className="w-4 h-4 md:w-5 md:h-5 text-[#e11d48]" />
                Technologies Used
              </h3>
              {project.TechStack.length > 0 ? (
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {project.TechStack.map((tech, index) => (
                    <TechBadge key={index} tech={tech} />
                  ))}
                </div>
              ) : (
                <p className="text-sm md:text-base text-[#cbd5e1]/70 opacity-50">
                  No technologies added.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 md:space-y-10 animate-slideInRight">
            <div className="relative rounded-2xl overflow-hidden border border-[#2a1919] shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#070014] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={project.Img}
                alt={project.Title}
                className="w-full object-cover transform transition-transform duration-700 will-change-transform group-hover:scale-105"
                onLoad={() => setIsImageLoaded(true)}
              />
              <div className="absolute inset-0 border-2 border-[#2a1919]/0 group-hover:border-[#e11d48]/20 transition-colors duration-300 rounded-2xl" />
            </div>

            {/* Key Features */}
            <div className="bg-[#1b1212]/50 backdrop-blur-xl rounded-2xl p-8 border border-[#2a1919] space-y-6 hover:border-[#e11d48]/30 transition-colors duration-300 group">
              <h3 className="text-xl font-semibold text-[#fdf2f8]/90 flex items-center gap-3">
                <Star className="w-5 h-5 text-[#eab308] group-hover:rotate-[20deg] transition-transform duration-300" />
                Key Features
              </h3>
              {project.Features.length > 0 ? (
                <ul className="list-none space-y-2">
                  {project.Features.map((feature, index) => (
                    <FeatureItem key={index} feature={feature} />
                  ))}
                </ul>
              ) : (
                <p className="text-[#cbd5e1]/70 opacity-50">No features added.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s ease-out;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.7s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.7s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetails;
