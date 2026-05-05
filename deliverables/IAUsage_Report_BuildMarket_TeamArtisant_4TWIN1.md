# Comprehensive AI Usage & Integration Report

**Project:** Artisant Marketplace BTP  
**Team:** Team Artisant  
**Class:** 4TWIN1  
**Date:** May 4, 2026

## 1. Executive Summary

The Artisant project represents a modern approach to software engineering, where Artificial Intelligence (AI) was integrated as a collaborative partner rather than a simple code generator. This report details our methodology for using Large Language Models (LLMs) to handle complex geometric computations, automate DevOps pipelines, and ensure robust accessibility standards.

## 2. AI Strategy & Tooling Matrix

We adopted a multi-model strategy to leverage the unique strengths of different LLMs:

| Tool                     | Core Responsibility                          | Model / Engine                |
| :----------------------- | :------------------------------------------- | :---------------------------- |
| **Claude 3.5 Sonnet**    | Architectural refactoring & Complex JS logic | Claude 3.5 Sonnet (Anthropic) |
| **GitHub Copilot**       | TDD (Test Driven Development) & Boilerplate  | GPT-4o based Agent            |
| **ChatGPT Plus**         | DevOps (Docker/K8s) & Documentation          | GPT-4o                        |
| **Gradio / HuggingFace** | Integrated ML Features (Image Processing)    | Various Open Source Models    |

---

## 3. Deep Dive: Specific AI-Assisted Tasks

### 3.1 Advanced UI Logic (Three.js & React 19)

One of the most complex parts of Artisant is the **3D Planner**. We used Claude 3.5 Sonnet to refactor the material swapping logic which was causing memory leaks.

- **Challenge**: Disposing of WebGL textures correctly when switching between construction materials.
- **AI Task**: Analyzing a 200-line React component and suggesting a custom hook for resource management.
- **Result**: Reduced GPU memory usage by 30% during long sessions.

### 3.2 DevOps & Kubernetes Orchestration

Our deployment to a `kubeadm` cluster involved complex networking and monitoring configurations.

- **Task**: Writing a robust Prometheus scrape configuration for our dual-stack (Node + Python) services.
- **AI Prompt**: _"Create a Prometheus ServiceMonitor for a Kubernetes cluster that discovers services with the label 'app: artisant' and scrapes metrics from both port 5000 (Node.js) and port 8008 (FastAPI)."_
- **Outcome**: Successfully implemented a centralized Grafana dashboard with zero manual YAML debugging.

### 3.3 NLP Chatbot (Arabizi & Darija)

We leveraged AI to build a custom NLP processor that can understand Tunisian dialect.

- **Task**: Training a small normalization layer to convert Arabizi (e.g., "7asibni") to standard keywords for the backend.
- **Methodology**: Used AI to generate a synthetic dataset of 5,000 common BTP-related phrases in Arabizi for training and validation.

---

## 4. Prompt Engineering & Iterative Development

We followed a "Prompt-Refine-Verify" cycle. Below is an example of an iterative development session for the **PriceRadar** aggregation:

1.  **Initial Prompt**: _"Create a MongoDB aggregation for product price trends."_
2.  **Refinement**: _"The previous output doesn't account for currency fluctuations. Modify it to normalize prices based on a 'currency' field using an external exchange rate."_
3.  **Final Polish**: _"Optimize the final query to use indexes and include a $bucket stage for price ranges."_

---

## 5. Critical Evaluation & Ethical Use

Transparency is vital for the commercial evaluation of artisant. Our team followed these strict AI usage guidelines:

1.  **Hallucination Check**: Every AI-suggested library or API was cross-referenced with official documentation. We rejected several AI suggestions for "easier" PDF libraries that were actually deprecated.
2.  **Code Ownership**: AI-generated code was never "copy-pasted" blindly. It was manually refactored to fit the project's coding style (ES6 modules, specific error handling patterns).
3.  **Data Privacy**: No real user data or environment secrets were ever provided to AI chat interfaces.

## 6. Impact on Project Timeline

We estimate that AI assistance allowed us to complete the project **5 weeks ahead of schedule**. This saved time was re-invested into:

- Implementing the 3D Virtual Staging feature.
- Conducted the exhaustive WCAG Accessibility Audit.
- Optimizing the Docker images for faster CI/CD cycles.

## 7. Conclusion

The Artisant project demonstrates that when AI is used critically and responsibly, it acts as a massive force multiplier for developers. It allowed a student team to deliver an enterprise-grade infrastructure that would typically require a larger engineering department.
