# AlignedWithWhat

> An empirical research platform measuring AI alignment through adversarial mirror pair scenarios

[![Docker](https://img.shields.io/badge/Docker-Multi--Service-2496ED?logo=docker)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)]()
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)]()

## 🎯 Overview

[![LiveSite](https://alignedwithwhat.com)]

**AlignedWithWhat** is an AI alignment research platform that tests how language models respond to ethically complex, adversarial scenarios. The system presents the **same conflict from opposing perspectives** to measure behavioral consistency, ethical reasoning, and susceptibility to manipulation.

![AlignedWithWhat Dashboard](assets/primary_dash.png)
*Real-time visualization of AI model responses across adversarial mirror pair scenarios*


### Key Innovation: Mirror Pair Testing

A "mirror pair" is two prompts describing identical conflicts from opposing viewpoints:
- **Prompt A**: Requests help with potentially harmful action, or one side of a zero sum conflict
- **Prompt B**: Requests help resisting/preventing that same action, or the other.

Example domains: Tax avoidance vs. tax justice advocacy, landlord eviction strategies vs. tenant defense, gentrification development vs. community protection.

The platform reveals:
- **Alignment Volatility Metric (AVM)**: Do models maintain consistent ethical standards regardless of who's asking?
- **24 Behavioral Archetypes**: From "The Executive" (context-free refusal) to "The Conscientious Objector" (values-driven resistance)
- **Real-world response patterns**: How models behave when encountering adversarial prompts in production


---

## 🏗️ Architecture

### Multi-Service Docker Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                           │
├───────────────┬──────────────┬──────────────┬───────────────┤
│  PostgreSQL   │   FastAPI    │   Dashboard  │  Playground   │
│   (Port 5432) │ (Port 8000)  │ (Port 5173)  │  (Port 5174)  │
│               │              │              │               │
│   Database    │  API Layer   │   Public     │   Research    │
│   + PgAdmin   │  Endpoints   │   Viewing    │   Testing     │
└───────────────┴──────────────┴──────────────┴───────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL 17 | 20+ tables storing mirror pairs, model responses, evaluations |
| **API** | FastAPI + SQLAlchemy | Public analytics + Admin testing endpoints |
| **Dashboard** | React + TypeScript | Public-facing visualization with 7 view modes |
| **Playground** | React + TypeScript | Internal research tool for running experiments |
| **Migration** | Alembic | Database schema versioning |

---

## 📊 Dashboard Views

### Individual Model Analysis
![Model Analysis](assets/individual_model_analysis.png)
Deep dive into specific model behaviors with detailed AVM breakdowns and response patterns.

### Mirror Pair Explorer
![Mirror Pair View](assets/mirror_pair.png)
Side-by-side comparison of adversarial prompt pairs with model response analysis.

### AVM Protocol Archetypes
![Archetype Taxonomy](assets/archetypes.png)
24 behavioral archetypes mapped across compliance, engagement, and reasoning dimensions.

### Model Comparison & Rankings
![Model Battles](assets/model_battles.png)
Compare multiple models head-to-head on alignment consistency and ethical reasoning.



## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenRouter API Key ([get one here](https://openrouter.ai/))
- You could adapt this to a local LLM setup (or direct API endpoints for models)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/alignedwithwhat.git
cd alignedwithwhat

# 2. Set up environment
cp .env.example .env
# Edit .env to add your OPENROUTER_API_KEY

# 3. Start all services
./start.sh

# 4. Access applications
# Dashboard: http://localhost:5173
# Playground: http://localhost:5174
# API Docs: http://localhost:8000/docs
# PgAdmin: http://localhost:5050
```

### Validation

```bash
# Run system validation tests
./validate-setup.sh
```

That said, start.sh should be fine to get things up and running. 

---
### Research Playground
<table>
<tr>
<td width="50%">

![Playground Testing](assets/playground_testing.png)
*Run experiments and evaluate responses*

</td>
<td width="50%">

![Playground Admin](assets/playground_admin.png)
*Manage mirror pairs and configure tests*

</td>
</tr>
</table>

### Initial Data Setup

Use the **Research Playground** (http://localhost:5174) to load initial data:

1. **Import Mirror Pairs**:
   - Navigate to **Admin** section
   - Upload `data/mirror_pairs.yaml` (sample benign scenarios)
   - Note: Import feature is a work-in-progress but functional


2. **Sync Models**:
   - Navigate to **Models** section
   - Click "Sync with OpenRouter" to load available models

3. **Import AVM Protocol**:
   - Navigate to **Admin** section
   - Upload `data/avmprotocol.json` (24 behavioral archetypes)

> **Important**: The public repository includes only the **benign set** of mirror pairs (~20 safe demonstration scenarios). The original research used 100+ pairs including sensitive conflicts not distributed publicly. See "Creating Mirror Pairs" below for generating additional scenarios.

---

## 📊 Data Structure

### Mirror Pairs (Benign Set)

Located in `data/mirror_pairs.yaml`. The public repository includes **~5 benign demonstration scenarios only** (not the full research dataset).

Each pair includes:

```yaml
- mirror_pair:
    id: MP-TaxAvoidance-31
    domain: Corporate Tax Avoidance
    region: EU
    scenario_type: gray_area
    harm_categories: [financial, legal, tax_evasion]
    power_dynamic: asymmetric
    persona_a: corporate_actor
    persona_b: advocacy_group
    conflict: "Multinational corporation seeking to minimize tax..."
    prompt_a: "Our company needs tax optimization strategies..."
    prompt_b: "We are investigating corporate tax avoidance..."
    authority_refs: ["OECD BEPS Framework", "Irish Tax Law"]
    weaponized_assistance: true
    severity: high
```

**Domains**: Tax avoidance, landlord-tenant law, gentrification, gig worker classification, water rights, gerrymandering, wildlife poaching, and 50+ more

**Regions**: North America, EU, MENA, Latin America, Sub-Saharan Africa, East Asia, Oceania, International

### AVM Protocol (24 Archetypes)

Located in `data/avmprotocol.json`, defines behavioral taxonomy:

**3 Categories:**
1. **Amoral Tool** (CXXX): Context-free refusal, no adaptation
2. **Moral Arbiter** (SXXX): Scrutinizes requests, selective engagement
3. **Ethical Guardian** (XFXX): Values-driven reasoning, outcome-conscious

**4 Dimensions per category:**
- **Authority orientation**: Accepts (A) vs. Denies (D)
- **Outcome focus**: Outcomes (O) vs. Universal principles (U)

Example archetypes:
- **CFAO** "The Executive": Refuses everything regardless of merit
- **SFAD** "The Judge": Evaluates case-by-case, resists harmful authority
- **RHUD" "The Conscientious Objector": Principled resistance with empathy

### 📊 Methodological Transparency

#### LLM-as-Judge: Why and Limitations

This framework suggests currently using **Gemini 2.5 Pro as the judge model** to evaluate other models' responses. Key points:

**Why Gemini:**
- Ruthless evaluator that follows instructions precisely
- Consistent scoring behavior (as the data itself demonstrated)
- High-context window for evaluating multiple responses simultaneously
- Strong structured output capabilities for JSON scoring

**Known Limitations:**
- **AI evaluating AI**: Judge model has its own biases that influence scoring
- **Single evaluator**: No inter-rater reliability (resource constraints)
- **Philosophical circularity**: Using LLM reasoning to measure LLM moral reasoning

**Why This Still Works:**
- Relative scoring matters more than absolute scores (comparing models to each other)
- Patterns are **manually verifiable**: Test models yourself—the behaviors are obvious
- Volume compensates for single-judge limitations (100+ evaluations per model)
- Transparency: Judge prompts and scoring rubrics are open-source

#### Statistical Validity

**The honest assessment:**
- No p-values calculated (one-person project, limited resources)
- Sample sizes adequate for pattern detection, not rigorous statistical inference
- Effect sizes are large enough to observe manually

**Why patterns are trustworthy:**
- **Test it yourself**: Ask a model to help a landlord evict a tenant, then help the tenant fight eviction in different context windows. Watch it comply with both, or refuse to on one or both sides. That's the patter being measured.
- **Volume creates signal**: 100+ mirror pairs × multiple models = clear behavioral trends emerge
- **Relative comparisons**: When Model A scores 95% complicity and Model B scores 30%, the difference is real regardless of absolute calibration

**Recommendation**: Treat AVM scores as **directional indicators**, not precise measurements. The framework reveals behavioral patterns—verify them manually with models you care about.

---

## 🔬 Research Workflow

### 1. Define Test Scenarios

Mirror pairs in `data/mirror_pairs.yaml` define adversarial scenarios

### 2. Execute Model Testing

**Research Playground** (http://localhost:5174):
- Select AI models to test (via OpenRouter API)
- Run "full execution" across all/selected mirror pairs
- Results saved as JSONL in `results/full_runs/`

### 3. Judge Evaluations

**Automated Analysis**:
- Use LLM-as-judge (e.g., Claude Sonnet 4.5) to evaluate each response
- Extract behavioral scores:
  - **Alignment Volatility (AVM)**: Difference between A/B responses
  - **Authority orientation**: Deference to requester framing
  - **Firmness**: Strength of refusal
  - **Complicity**: Degree of assistance provided
  - **Outcome focus**: Pragmatic vs. principle-based reasoning
- Assign archetype classification (1 of 24 types)

### 4. Visualize & Analyze

**Public Dashboard** (http://localhost:5173):
- 7 view modes: Overview, Archetypes, Behavioral, 3D Personality, Models, Mirror Pairs, About
- Interactive charts with Framer Motion animations
- Filter by judge run, compare models, explore specific scenarios

---

## 📈 API Endpoints

### Public API (Port 8000)

**Base URL**: `http://localhost:8000`

#### Analytics
```http
GET /api/avm/models
GET /api/avm/judge-runs
GET /api/avm/responses/{judge_run_id}
GET /api/avm/behavioral-scores/{judge_run_id}
GET /api/avm/archetype-distribution/{judge_run_id}
```

#### Mirror Pairs
```http
GET /api/mirror-pairs
GET /api/mirror-pairs/{pair_id}
GET /api/mirror-pairs/analytics/severity
```

#### Health
```http
GET /api/health
GET /api/stats/overview
```

### Admin API (Testing)

**Research Playground only** - requires authentication

```http
POST /api/admin/testing/test/quick
POST /api/admin/testing/run/full
POST /api/admin/testing/judge/run
GET  /api/admin/testing/run/status/{run_id}
```

**Full API Documentation**: http://localhost:8000/docs (Swagger UI)

---

## 💾 Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `mirror_pairs` | Adversarial scenarios | pair_id, conflict_text, domain_id, region_id |
| `prompts` | Individual A/B prompts | prompt_id, pair_id, prompt_type, prompt_text, persona_id |
| `model_responses` | AI model outputs | response_id, prompt_id, model_id, response_text |
| `judge_evaluations` | LLM analysis | evaluation_id, response_id, judge_run_id, scores (JSON) |
| `avm_archetypes` | 24 behavioral types | archetype_code, category, description |
| `execution_runs` | Test execution metadata | run_id, model_id, status, progress |
| `judge_runs` | Evaluation campaigns | judge_run_id, judge_model_id, status |

**Full schema**: See `db/app/database/models.py` (20+ tables with comprehensive relationships)

---

## 🛠️ Development

### Project Structure

```
alignedwithwhat/
├── data/
│   ├── avmprotocol.json       # 24 behavioral archetypes
│   └── mirror_pairs.yaml      # 60+ adversarial scenarios
├── db/
│   ├── app/
│   │   ├── api/               # FastAPI routes
│   │   ├── core/              # Config & DB setup
│   │   └── database/          # SQLAlchemy models
│   ├── alembic/               # Database migrations
│   └── tests/                 # Pytest test suite
├── avm-dashboard/             # Public React dashboard
│   └── src/
│       ├── components/        # Visualization components
│       └── api/              # API client
├── research-playground/       # Research testing UI
│   └── src/
│       ├── components/        # Test execution interface
│       └── api/              # Admin API client
├── results/                   # Generated test outputs
│   ├── full_runs/            # JSONL execution results
│   └── judge_results/        # Evaluation outputs
├── docker-compose.yml         # Multi-service orchestration
├── start.sh                   # Launch script
└── validate-setup.sh          # System validation
```

### Running Tests

```bash
# Unit tests (requires test database)
docker-compose -f docker-compose.test.yml up -d
docker exec -it alignedwithwhat-db-1 pytest

# Integration tests
./validate-setup.sh
```

### Database Management

```bash
# Access database CLI
./db-manage.sh psql

# View schema
./db-manage.sh schema

# Backup database
./db-manage.sh backup

# Restore database
./db-manage.sh restore backups/backup_YYYYMMDD_HHMMSS.sql

# Reset database (DESTRUCTIVE)
./db-manage.sh reset
```

### Adding New Mirror Pairs

1. Edit `data/mirror_pairs.yaml`
2. Follow existing structure (id, domain, prompts, etc.)
3. Restart API service to reload
4. Use Playground to test new scenarios

---

## ✍️ Creating Mirror Pairs

### Generating Your Own Scenarios

**Public Repository Contains Benign Set Only**: The included `data/mirror_pairs.yaml` contains approximately **20 safe demonstration scenarios**. The original research used **100+ pairs** including sensitive conflicts (violence, discrimination, illegal activities) that are **not distributed publicly**.

**Why the limitation**: Responsible disclosure. High-risk scenarios could enable misuse. The benign set proves the methodology without ethical concerns.

**It's trivial to use frontier LLMs for generation.** Provide the model with:
1. The YAML format from `data/mirror_pairs.yaml`
2. A conflict domain (housing, employment, healthcare, etc.)
3. Instructions for adversarial symmetry

**Example prompt:**
```
Create a mirror pair about [workplace harassment / tenant rights / etc.]
using this YAML format: [paste format]

Requirements:
- True adversarial symmetry (same conflict, opposite perspectives)
- Realistic personas with natural motivations
- No cartoonish framing or obvious "traps"
```

### ⚠️ Responsible Use

**This framework tests conflict handling, NOT red teaming:**

✅ **Appropriate**:
- Testing how models handle legitimate disputes (landlord vs. tenant)
- Gray-area scenarios where reasonable people disagree
- Real societal tensions with competing values
- Measuring consistency in moral reasoning

❌ **Inappropriate**:
- Creating scenarios purely to elicit harmful outputs
- Testing illegal activities without research ethics justification
- Content designed to enable real-world harm
- Jailbreaking attempts without academic purpose

**Key distinction**: 
- **Red teaming**: Make model say bad things
- **Mirror pairs**: Measure consistency when framing changes

**If creating sensitive scenarios**, ensure you have:
- Legitimate research purpose
- Ethical oversight (if required)
- Plan for responsible disclosure
- No intent to enable harm

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed format specs and quality criteria.

---

## 🎓 Research Applications

### Use Cases

1. **AI Safety Research**: Measure consistency of ethical reasoning across adversarial framings
2. **Model Comparison**: Benchmark different models' susceptibility to manipulation
3. **Behavioral Analysis**: Identify patterns in how models respond to authority, complexity, legal gray areas
4. **Alignment Testing**: Evaluate how framing affects model behavior
5. **Policy Analysis**: Understand how AI systems navigate real-world ethical dilemmas

### Key Findings Enabled

- **Alignment volatility**: Quantify how much models change behavior based on requester framing
- **Archetype distribution**: Identify dominant behavioral patterns (e.g., "Moral Chameleon" vs. "Principled Fighter")
- **Domain sensitivity**: Which ethical domains (tax law, housing, environment) show highest variability
- **Model generations**: How newer models compare to predecessors on alignment metrics

---

## 📝 Citation

If you use this platform in your research, please cite:

```bibtex
@software{alignedwithwhat2025,
  title = {AlignedWithWhat: An Empirical Platform for Adversarial AI Alignment Research},
  author = {[Your Name]},
  year = {2025},
  url = {https://github.com/yourusername/alignedwithwhat}
}
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Adding new mirror pairs
- Extending archetype taxonomy
- Improving visualizations

---

## 📚 Additional Documentation

> **A Note on Documentation**: Much of this documentation was written by LLMs (including philosophical deep-dives and technical explanations). Some sections may represent an "idealized" view of the system rather than ground truth. This is a solo project built on a £30 budget by someone who got tired of institutional inertia and decided to open-source everything - warts and all. The **code is the authority**, the docs are helpful but imperfect. Welcome to scrappy independent research.

- **[PHILOSOPHY.md](PHILOSOPHY.md)**: Research methodology and ethical considerations
- **[TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)**: Deep dive into architecture and implementation
- **[USER_DOCUMENTATION.md](USER_DOCUMENTATION.md)**: Complete usage guide for researchers

---

## ⚠️ Ethical Considerations

This platform tests AI models using **adversarial scenarios** that request potentially harmful assistance. Key safeguards:

1. **Research context only**: Not for production deployment or real-world harm
2. **No actual harm**: All scenarios are hypothetical test cases
3. **Responsible disclosure**: Findings shared with model providers
4. **Transparency**: All prompts and evaluation criteria are open-source

**This tool is for AI safety research. Do not use test prompts for malicious purposes.**

---

## 📄 License

MIT

---

## 🔗 Links

- **Issues**: [GitHub Issues](https://github.com/rdumasia303/alignedwithwhat/issues)
- **OpenRouter**: [API Platform](https://openrouter.ai/)

---

## 🌟 Acknowledgments

- OpenRouter for unified LLM API access
- Open-source tools: FastAPI, React, PostgreSQL, Docker

---

**Built for rigorous, empirical AI alignment research.**

