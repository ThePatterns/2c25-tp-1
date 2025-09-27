#!/bin/bash

# Script para ejecutar pruebas de rendimiento con Artillery y DataDog
# Uso: ./run-performance-tests.sh [test-type] [environment]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}Uso: $0 [test-type] [environment]${NC}"
    echo ""
    echo "Tipos de prueba disponibles:"
    echo "  load-test     - Prueba de carga normal (por defecto)"
    echo "  stress-test   - Prueba de estrés con carga alta"
    echo "  spike-test    - Prueba de picos de tráfico"
    echo "  volume-test   - Prueba de volumen sostenido"
    echo "  all          - Ejecutar todas las pruebas"
    echo ""
    echo "Entornos disponibles:"
    echo "  api          - Entorno de API (por defecto)"
    echo ""
    echo "Ejemplos:"
    echo "  $0 load-test api"
    echo "  $0 stress-test"
    echo "  $0 all"
}

check_artillery() {
    if ! command -v artillery &> /dev/null; then
        echo -e "${RED}Error: Artillery no está instalado${NC}"
        echo "Instala Artillery con: npm install -g artillery"
        exit 1
    fi
}

check_services() {
    echo -e "${YELLOW}Verificando servicios...${NC}"

    if ! curl -s http://localhost:5555/rates > /dev/null; then
        echo -e "${RED}Error: La API no está respondiendo en http://localhost:5555${NC}"
        echo "Asegúrate de que los servicios estén corriendo con: docker-compose up -d"
        exit 1
    fi
    
    echo -e "${GREEN}✓ API está respondiendo${NC}"
}

run_test() {
    local test_type=$1
    local environment=${2:-api}
    local test_file="perf/${test_type}.yaml"
    
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}Error: Archivo de prueba no encontrado: $test_file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Ejecutando prueba: $test_type${NC}"
    echo -e "${YELLOW}Archivo: $test_file${NC}"
    echo -e "${YELLOW}Entorno: $environment${NC}"
    echo ""
    
    cd perf
    artillery run "${test_file#perf/}" -e "$environment"
    cd ..
    
    echo -e "${GREEN}✓ Prueba $test_type completada${NC}"
    echo ""
}

show_datadog_info() {
    echo -e "${BLUE}Información de DataDog:${NC}"
    echo "Dashboard: https://app.datadoghq.com/dashboard (TODO)"
    echo "APM: https://us5.datadoghq.com/apm/entity/service%3Aexchange-api"
    echo "Métricas: https://us5.datadoghq.com/metric/explorer"
    echo ""
    echo "Métricas personalizadas de arVault:"
    echo "- arvault.volume.by_currency"
    echo "- arvault.volume.net"
    echo "- arvault.exchange.transactions"
    echo "- arvault.api.response_time"
    echo ""
}

main() {
    local test_type=${1:-load-test}
    local environment=${2:-api}
    
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    echo -e "${BLUE}=== Ejecutor de Pruebas de Rendimiento arVault ===${NC}"
    echo ""
    
    check_artillery
    check_services
    show_datadog_info
    
    case $test_type in
        "all")
            echo -e "${YELLOW}Ejecutando todas las pruebas...${NC}"
            run_test "load-test" "$environment"
            sleep 30
            run_test "stress-test" "$environment"
            sleep 30
            run_test "spike-test" "$environment"
            sleep 30
            run_test "volume-test" "$environment"
            ;;
        "load-test"|"stress-test"|"spike-test"|"volume-test")
            run_test "$test_type" "$environment"
            ;;
        *)
            echo -e "${RED}Error: Tipo de prueba no válido: $test_type${NC}"
            show_help
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}=== Pruebas completadas ===${NC}"
    echo -e "${YELLOW}Revisa las métricas en DataDog para analizar los resultados${NC}"
}

main "$@"
