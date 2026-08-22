// Pipeline principal do projeto — substitui o antigo .github/workflows/ci.yml.
// Cada stage roda dentro de um container Docker efêmero (node:20), que o
// Jenkins pede pro Docker do host pra subir (usando o socket montado em
// docker-compose.yml). Isso garante que o build roda sempre no mesmo
// ambiente, independente da máquina que tem o Jenkins instalado.

pipeline {
  agent none

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME = "tasksorg-web"
  }

  stages {
    stage('Instalar dependências') {
      agent {
        docker { image 'node:20-bullseye' }
      }
      steps {
        checkout scm
        sh 'corepack enable'
        sh 'pnpm install --frozen-lockfile'
        // guarda o workspace (com node_modules) pros próximos stages não
        // reinstalarem tudo de novo. Simplificação de POC: numa pipeline
        // "de verdade" isso seria substituído por cache de camadas Docker
        // ou pelo cache nativo de dependências do pnpm.
        stash name: 'workspace-com-deps', includes: '**', excludes: '.git/**'
      }
    }

    stage('Qualidade') {
      agent {
        docker { image 'node:20-bullseye' }
      }
      steps {
        unstash 'workspace-com-deps'
        sh 'corepack enable'
        sh 'pnpm lint'
        sh 'pnpm typecheck'
        sh 'pnpm test'
      }
    }

    stage('Build (web + desktop)') {
      agent {
        docker { image 'node:20-bullseye' }
      }
      steps {
        unstash 'workspace-com-deps'
        sh 'corepack enable'
        sh 'pnpm turbo run build --filter=@tasksorg/web --filter=@tasksorg/desktop'
      }
    }

    stage('Build da imagem Docker (web)') {
      // este stage roda no próprio container do Jenkins (não em outro
      // container node:20), porque é ele quem tem o Docker CLI + acesso
      // ao socket do Docker do host.
      agent { label 'built-in' }
      steps {
        checkout scm
        sh "docker build -f apps/web/Dockerfile -t ${IMAGE_NAME}:${env.BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
      }
    }

    // Próximo passo natural: um stage "Deploy" (docker run / kubectl apply)
    // e, com o Kubernetes entrando no projeto, um stage "kubectl apply -f k8s/"
    // publicando essa imagem num cluster.
  }

  post {
    success {
      echo "Pipeline concluído com sucesso — imagem ${IMAGE_NAME}:${env.BUILD_NUMBER} pronta."
    }
    failure {
      echo 'Pipeline falhou — confira os logs do stage que quebrou.'
    }
  }
}
