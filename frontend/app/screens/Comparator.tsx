import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { ThemeContext } from '../context/ThemeContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ComparisonScenario {
  id: number;
  name: string;
  salary: string;
  calculationType: 'gross_to_net' | 'net_to_gross';
  medicalAid: string;
  loans: string;
  otherDiscounts: string;
  result?: any;
  isLoading: boolean;
}

export default function Comparator() {
  const { theme } = useContext(ThemeContext);
  const [scenarios, setScenarios] = useState<ComparisonScenario[]>([
    {
      id: 1,
      name: 'Cenário 1',
      salary: '',
      calculationType: 'gross_to_net',
      medicalAid: '',
      loans: '',
      otherDiscounts: '',
      isLoading: false,
    },
    {
      id: 2,
      name: 'Cenário 2',
      salary: '',
      calculationType: 'gross_to_net',
      medicalAid: '',
      loans: '',
      otherDiscounts: '',
      isLoading: false,
    },
  ]);

  const [salaryIncreaseCalculator, setSalaryIncreaseCalculator] = useState({
    currentSalary: '',
    increasePercentage: '',
    increaseAmount: '',
    calculationType: 'percentage' as 'percentage' | 'amount',
    result: null as any,
  });

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MTn`;
  };

  const updateScenario = (id: number, field: string, value: string) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === id ? { ...scenario, [field]: value } : scenario
    ));
  };

  const calculateScenario = async (id: number) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario || !scenario.salary) {
      Alert.alert('Erro', 'Por favor, insira o valor do salário');
      return;
    }

    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, isLoading: true } : s
    ));

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/calculate-salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salary: parseFloat(scenario.salary),
          calculation_type: scenario.calculationType,
          medical_aid: parseFloat(scenario.medicalAid) || 0,
          loans: parseFloat(scenario.loans) || 0,
          other_discounts: parseFloat(scenario.otherDiscounts) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const result = await response.json();
      setScenarios(prev => prev.map(s => 
        s.id === id ? { ...s, result, isLoading: false } : s
      ));
    } catch (error) {
      Alert.alert('Erro', 'Falha ao calcular o salário. Tente novamente.');
      setScenarios(prev => prev.map(s => 
        s.id === id ? { ...s, isLoading: false } : s
      ));
    }
  };

  const addScenario = () => {
    if (scenarios.length >= 5) {
      Alert.alert('Limite', 'Máximo de 5 cenários permitidos');
      return;
    }

    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    setScenarios(prev => [...prev, {
      id: newId,
      name: `Cenário ${newId}`,
      salary: '',
      calculationType: 'gross_to_net',
      medicalAid: '',
      loans: '',
      otherDiscounts: '',
      isLoading: false,
    }]);
  };

  const removeScenario = (id: number) => {
    if (scenarios.length <= 1) {
      Alert.alert('Erro', 'Deve haver pelo menos um cenário');
      return;
    }
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const clearAllScenarios = () => {
    setScenarios(prev => prev.map(s => ({
      ...s,
      salary: '',
      medicalAid: '',
      loans: '',
      otherDiscounts: '',
      result: undefined,
    })));
  };

  const getComparisonChartData = () => {
    const calculatedScenarios = scenarios.filter(s => s.result);
    
    return calculatedScenarios.map((scenario, index) => ({
      value: scenario.result.monthly_breakdown.salario_liquido,
      label: `C${scenario.id}`,
      frontColor: ['#2E7D32', '#1976D2', '#F57C00', '#9C27B0', '#607D8B'][index] || '#2E7D32',
    }));
  };

  const calculateSalaryIncrease = () => {
    const current = parseFloat(salaryIncreaseCalculator.currentSalary);
    if (!current) {
      Alert.alert('Erro', 'Por favor, insira o salário atual');
      return;
    }

    let newSalary = current;
    let increaseValue = 0;

    if (salaryIncreaseCalculator.calculationType === 'percentage') {
      const percentage = parseFloat(salaryIncreaseCalculator.increasePercentage);
      if (!percentage) {
        Alert.alert('Erro', 'Por favor, insira a porcentagem de aumento');
        return;
      }
      increaseValue = (current * percentage) / 100;
      newSalary = current + increaseValue;
    } else {
      increaseValue = parseFloat(salaryIncreaseCalculator.increaseAmount);
      if (!increaseValue) {
        Alert.alert('Erro', 'Por favor, insira o valor do aumento');
        return;
      }
      newSalary = current + increaseValue;
    }

    const percentageIncrease = ((newSalary - current) / current) * 100;

    setSalaryIncreaseCalculator(prev => ({
      ...prev,
      result: {
        currentSalary: current,
        newSalary,
        increaseValue,
        percentageIncrease,
      },
    }));
  };

  const styles = getStyles(theme);

  const renderScenario = (scenario: ComparisonScenario) => (
    <View key={scenario.id} style={styles.scenarioCard}>
      <View style={styles.scenarioHeader}>
        <TextInput
          style={styles.scenarioNameInput}
          value={scenario.name}
          onChangeText={(text) => updateScenario(scenario.id, 'name', text)}
          placeholder="Nome do cenário"
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity 
          onPress={() => removeScenario(scenario.id)}
          style={styles.removeButton}
        >
          <MaterialIcons name="close" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            scenario.calculationType === 'gross_to_net' && styles.typeButtonActive
          ]}
          onPress={() => updateScenario(scenario.id, 'calculationType', 'gross_to_net')}
        >
          <Text style={[
            styles.typeButtonText,
            scenario.calculationType === 'gross_to_net' && styles.typeButtonTextActive
          ]}>
            Bruto → Líquido
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            scenario.calculationType === 'net_to_gross' && styles.typeButtonActive
          ]}
          onPress={() => updateScenario(scenario.id, 'calculationType', 'net_to_gross')}
        >
          <Text style={[
            styles.typeButtonText,
            scenario.calculationType === 'net_to_gross' && styles.typeButtonTextActive
          ]}>
            Líquido → Bruto
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {scenario.calculationType === 'gross_to_net' ? 'Salário Bruto' : 'Salário Líquido'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={scenario.salary}
            onChangeText={(text) => updateScenario(scenario.id, 'salary', text)}
            placeholder="50000"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroupSmall}>
          <Text style={styles.inputLabelSmall}>Seguro Médico</Text>
          <TextInput
            style={styles.textInputSmall}
            value={scenario.medicalAid}
            onChangeText={(text) => updateScenario(scenario.id, 'medicalAid', text)}
            placeholder="1500"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.inputGroupSmall}>
          <Text style={styles.inputLabelSmall}>Empréstimos</Text>
          <TextInput
            style={styles.textInputSmall}
            value={scenario.loans}
            onChangeText={(text) => updateScenario(scenario.id, 'loans', text)}
            placeholder="5000"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.inputGroupSmall}>
          <Text style={styles.inputLabelSmall}>Outros</Text>
          <TextInput
            style={styles.textInputSmall}
            value={scenario.otherDiscounts}
            onChangeText={(text) => updateScenario(scenario.id, 'otherDiscounts', text)}
            placeholder="2000"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.calculateButton}
        onPress={() => calculateScenario(scenario.id)}
        disabled={scenario.isLoading}
      >
        {scenario.isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <MaterialIcons name="calculate" size={20} color="#fff" />
            <Text style={styles.calculateButtonText}>Calcular</Text>
          </>
        )}
      </TouchableOpacity>

      {scenario.result && (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Bruto:</Text>
            <Text style={styles.resultValueGross}>
              {formatCurrency(scenario.result.monthly_breakdown.salario_bruto)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Líquido:</Text>
            <Text style={styles.resultValueNet}>
              {formatCurrency(scenario.result.monthly_breakdown.salario_liquido)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Descontos:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(scenario.result.monthly_breakdown.total_descontos)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderSalaryIncreaseCalculator = () => (
    <View style={styles.increaseCalculatorCard}>
      <Text style={styles.sectionTitle}>Calculadora de Aumento Salarial</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Salário Atual (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={salaryIncreaseCalculator.currentSalary}
          onChangeText={(text) => setSalaryIncreaseCalculator(prev => ({
            ...prev,
            currentSalary: text
          }))}
          placeholder="Ex: 45000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            salaryIncreaseCalculator.calculationType === 'percentage' && styles.typeButtonActive
          ]}
          onPress={() => setSalaryIncreaseCalculator(prev => ({
            ...prev,
            calculationType: 'percentage'
          }))}
        >
          <Text style={[
            styles.typeButtonText,
            salaryIncreaseCalculator.calculationType === 'percentage' && styles.typeButtonTextActive
          ]}>
            Por Porcentagem
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            salaryIncreaseCalculator.calculationType === 'amount' && styles.typeButtonActive
          ]}
          onPress={() => setSalaryIncreaseCalculator(prev => ({
            ...prev,
            calculationType: 'amount'
          }))}
        >
          <Text style={[
            styles.typeButtonText,
            salaryIncreaseCalculator.calculationType === 'amount' && styles.typeButtonTextActive
          ]}>
            Por Valor
          </Text>
        </TouchableOpacity>
      </View>

      {salaryIncreaseCalculator.calculationType === 'percentage' ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Porcentagem de Aumento (%)</Text>
          <TextInput
            style={styles.textInput}
            value={salaryIncreaseCalculator.increasePercentage}
            onChangeText={(text) => setSalaryIncreaseCalculator(prev => ({
              ...prev,
              increasePercentage: text
            }))}
            placeholder="Ex: 15"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Valor do Aumento (MTn)</Text>
          <TextInput
            style={styles.textInput}
            value={salaryIncreaseCalculator.increaseAmount}
            onChangeText={(text) => setSalaryIncreaseCalculator(prev => ({
              ...prev,
              increaseAmount: text
            }))}
            placeholder="Ex: 7500"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.calculateButton}
        onPress={calculateSalaryIncrease}
      >
        <MaterialIcons name="trending-up" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Calcular Aumento</Text>
      </TouchableOpacity>

      {salaryIncreaseCalculator.result && (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Atual:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(salaryIncreaseCalculator.result.currentSalary)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Novo Salário:</Text>
            <Text style={styles.resultValueNet}>
              {formatCurrency(salaryIncreaseCalculator.result.newSalary)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Valor do Aumento:</Text>
            <Text style={styles.resultValueGross}>
              {formatCurrency(salaryIncreaseCalculator.result.increaseValue)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Porcentagem:</Text>
            <Text style={styles.resultValue}>
              {salaryIncreaseCalculator.result.percentageIncrease.toFixed(2)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialIcons name="compare" size={32} color={theme.primary} />
          <Text style={styles.title}>Comparador de Salários</Text>
          <Text style={styles.subtitle}>Compare diferentes cenários salariais</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={addScenario}>
            <MaterialIcons name="add" size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Adicionar Cenário</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={clearAllScenarios}>
            <MaterialIcons name="clear-all" size={20} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Limpar Todos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Cenários de Comparação</Text>
        {scenarios.map(renderScenario)}

        {scenarios.some(s => s.result) && (
          <View style={styles.comparisonChartCard}>
            <Text style={styles.chartTitle}>Comparação de Salários Líquidos</Text>
            <View style={styles.chartWrapper}>
              <BarChart
                data={getComparisonChartData()}
                width={300}
                height={200}
                barWidth={40}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={4}
                maxValue={Math.max(...getComparisonChartData().map(item => item.value)) * 1.1}
              />
            </View>
            <View style={styles.legendContainer}>
              {scenarios.filter(s => s.result).map((scenario, index) => (
                <View key={scenario.id} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: ['#2E7D32', '#1976D2', '#F57C00', '#9C27B0', '#607D8B'][index] }
                    ]} 
                  />
                  <Text style={styles.legendText}>{scenario.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {renderSalaryIncreaseCalculator()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Compare diferentes cenários e simule aumentos salariais
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginTop: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
      marginTop: 16,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      gap: 8,
      ...theme.shadow,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    scenarioCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      ...theme.shadow,
    },
    scenarioHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    scenarioNameInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 8,
      marginRight: 12,
    },
    removeButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: theme.secondary,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.card,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    typeButtonTextActive: {
      color: '#fff',
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    inputGroup: {
      flex: 1,
      marginBottom: 16,
    },
    inputGroupSmall: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    inputLabelSmall: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 6,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    textInputSmall: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      padding: 8,
      fontSize: 14,
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    calculateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.primary,
      gap: 8,
      marginBottom: 16,
    },
    calculateButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: 'bold',
    },
    resultCard: {
      backgroundColor: theme.secondary,
      borderRadius: 8,
      padding: 16,
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    resultLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    resultValue: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '600',
    },
    resultValueGross: {
      fontSize: 14,
      color: '#f57c00',
      fontWeight: 'bold',
    },
    resultValueNet: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: 'bold',
    },
    comparisonChartCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      ...theme.shadow,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    chartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
      color: theme.text,
    },
    increaseCalculatorCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      ...theme.shadow,
    },
    footer: {
      padding: 20,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });
}