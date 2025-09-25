import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CalculationResult {
  id: string;
  gross_salary: number;
  net_salary: number;
  irps_tax: number;
  inss_employee: number;
  inss_employer: number;
  medical_aid: number;
  loans: number;
  other_discounts: number;
  total_discounts: number;
  monthly_breakdown: {[key: string]: number};
  annual_breakdown: {[key: string]: number};
  calculation_type: string;
  saved_name?: string;
}

export default function Calculator() {
  const { theme } = useContext(ThemeContext);
  const [calculationType, setCalculationType] = useState<'gross_to_net' | 'net_to_gross'>('gross_to_net');
  const [salary, setSalary] = useState('');
  const [medicalAid, setMedicalAid] = useState('');
  const [loans, setLoans] = useState('');
  const [otherDiscounts, setOtherDiscounts] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [showCharts, setShowCharts] = useState(false);

  const calculateSalary = async () => {
    if (!salary) {
      Alert.alert('Erro', 'Por favor, insira o valor do salário');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/calculate-salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salary: parseFloat(salary),
          calculation_type: calculationType,
          medical_aid: parseFloat(medicalAid) || 0,
          loans: parseFloat(loans) || 0,
          other_discounts: parseFloat(otherDiscounts) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao calcular o salário. Tente novamente.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalculation = async () => {
    if (!result) return;
    
    Alert.prompt(
      'Salvar Cálculo',
      'Digite um nome para este cálculo:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: async (name) => {
            if (name) {
              try {
                const savedCalculations = await AsyncStorage.getItem('savedCalculations');
                const calculations = savedCalculations ? JSON.parse(savedCalculations) : [];
                
                const calculationToSave = {
                  ...result,
                  saved_name: name,
                  saved_at: new Date().toISOString(),
                };
                
                calculations.push(calculationToSave);
                await AsyncStorage.setItem('savedCalculations', JSON.stringify(calculations));
                Alert.alert('Sucesso', 'Cálculo salvo com sucesso!');
              } catch (error) {
                Alert.alert('Erro', 'Falha ao salvar o cálculo.');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const clearForm = () => {
    setSalary('');
    setMedicalAid('');
    setLoans('');
    setOtherDiscounts('');
    setResult(null);
    setShowCharts(false);
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MTn`;
  };

  const getChartData = () => {
    if (!result) return [];
    
    const currentBreakdown = viewMode === 'monthly' ? result.monthly_breakdown : result.annual_breakdown;
    
    return [
      { value: currentBreakdown.irps, color: '#f44336', label: 'IRPS' },
      { value: currentBreakdown.inss_empregado, color: '#ff9800', label: 'INSS' },
      { value: currentBreakdown.seguro_medico, color: '#2196f3', label: 'Seguro Médico' },
      { value: currentBreakdown.emprestimos, color: '#9c27b0', label: 'Empréstimos' },
      { value: currentBreakdown.outros_descontos, color: '#607d8b', label: 'Outros' },
    ].filter(item => item.value > 0);
  };

  const getBarData = () => {
    if (!result) return [];
    
    const currentBreakdown = viewMode === 'monthly' ? result.monthly_breakdown : result.annual_breakdown;
    
    return [
      { value: currentBreakdown.salario_bruto, label: 'Bruto', frontColor: '#4caf50' },
      { value: currentBreakdown.total_descontos, label: 'Descontos', frontColor: '#f44336' },
      { value: currentBreakdown.salario_liquido, label: 'Líquido', frontColor: '#2e7d32' },
    ];
  };

  const styles = getStyles(theme);

  const renderCalculationTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>Tipo de Cálculo</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            calculationType === 'gross_to_net' && styles.typeButtonActive
          ]}
          onPress={() => setCalculationType('gross_to_net')}
        >
          <MaterialIcons 
            name="trending-down" 
            size={20} 
            color={calculationType === 'gross_to_net' ? '#fff' : theme.primary} 
          />
          <Text style={[
            styles.typeButtonText,
            calculationType === 'gross_to_net' && styles.typeButtonTextActive
          ]}>
            Bruto → Líquido
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            calculationType === 'net_to_gross' && styles.typeButtonActive
          ]}
          onPress={() => setCalculationType('net_to_gross')}
        >
          <MaterialIcons 
            name="trending-up" 
            size={20} 
            color={calculationType === 'net_to_gross' ? '#fff' : theme.primary} 
          />
          <Text style={[
            styles.typeButtonText,
            calculationType === 'net_to_gross' && styles.typeButtonTextActive
          ]}>
            Líquido → Bruto
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInputForm = () => (
    <View style={styles.inputSection}>
      <Text style={styles.sectionTitle}>Dados do Salário</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {calculationType === 'gross_to_net' ? 'Salário Bruto (MTn)' : 'Salário Líquido (MTn)'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={salary}
          onChangeText={setSalary}
          placeholder="Ex: 50000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Seguro Médico (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={medicalAid}
          onChangeText={setMedicalAid}
          placeholder="Ex: 1500"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Empréstimos (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={loans}
          onChangeText={setLoans}
          placeholder="Ex: 5000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Outros Descontos (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={otherDiscounts}
          onChangeText={setOtherDiscounts}
          placeholder="Ex: 2000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <MaterialIcons name="clear" size={20} color={theme.textSecondary} />
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.calculateButton} 
          onPress={calculateSalary}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="calculate" size={20} color="#fff" />
              <Text style={styles.calculateButtonText}>Calcular</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResults = () => {
    if (!result) return null;

    const currentBreakdown = viewMode === 'monthly' ? result.monthly_breakdown : result.annual_breakdown;

    return (
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Resultado do Cálculo</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                Mensal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'annual' && styles.toggleButtonActive]}
              onPress={() => setViewMode('annual')}
            >
              <Text style={[styles.toggleText, viewMode === 'annual' && styles.toggleTextActive]}>
                Anual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salário Bruto:</Text>
            <Text style={styles.summaryValueGross}>
              {formatCurrency(currentBreakdown.salario_bruto)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salário Líquido:</Text>
            <Text style={styles.summaryValueNet}>
              {formatCurrency(currentBreakdown.salario_liquido)}
            </Text>
          </View>
        </View>

        {/* Chart Toggle */}
        <View style={styles.chartToggleContainer}>
          <TouchableOpacity
            style={styles.chartToggle}
            onPress={() => setShowCharts(!showCharts)}
          >
            <MaterialIcons 
              name={showCharts ? 'bar-chart' : 'pie-chart'} 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.chartToggleText}>
              {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveCalculation}>
            <MaterialIcons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Charts */}
        {showCharts && (
          <View style={styles.chartsContainer}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Distribuição dos Descontos</Text>
              <View style={styles.chartWrapper}>
                <PieChart
                  data={getChartData()}
                  radius={80}
                  centerLabelComponent={() => (
                    <Text style={styles.centerLabel}>Descontos</Text>
                  )}
                  showText
                  textColor={theme.text}
                  textSize={12}
                />
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Comparação Bruto vs Líquido</Text>
              <View style={styles.chartWrapper}>
                <BarChart
                  data={getBarData()}
                  width={280}
                  height={200}
                  barWidth={60}
                  spacing={20}
                  roundedTop
                  roundedBottom
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={0}
                  noOfSections={4}
                  maxValue={Math.max(...getBarData().map(item => item.value)) * 1.1}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalhamento dos Descontos</Text>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="account-balance" size={16} color="#f44336" />
            <Text style={styles.detailLabel}>IRPS:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.irps)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="security" size={16} color="#f44336" />
            <Text style={styles.detailLabel}>INSS (Empregado 3%):</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.inss_empregado)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="business" size={16} color={theme.textSecondary} />
            <Text style={styles.detailLabel}>INSS (Empregador 4%):</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.inss_empregador)}
            </Text>
          </View>

          {currentBreakdown.seguro_medico > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="local-hospital" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Seguro Médico:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.seguro_medico)}
              </Text>
            </View>
          )}

          {currentBreakdown.emprestimos > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="attach-money" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Empréstimos:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.emprestimos)}
              </Text>
            </View>
          )}

          {currentBreakdown.outros_descontos > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="remove-circle" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Outros Descontos:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.outros_descontos)}
              </Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <MaterialIcons name="calculate" size={16} color={theme.primary} />
            <Text style={styles.totalLabel}>Total de Descontos:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(currentBreakdown.total_descontos)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <MaterialIcons name="calculate" size={32} color={theme.primary} />
            <Text style={styles.title}>Calculadora Salarial</Text>
            <Text style={styles.subtitle}>Moçambique • IRPS & INSS • 2025</Text>
          </View>

          {renderCalculationTypeSelector()}
          {renderInputForm()}
          {renderResults()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Cálculos baseados nas tabelas oficiais de IRPS e INSS de Moçambique para 2025
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
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
    },
    typeSelector: {
      marginBottom: 24,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 12,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.card,
      gap: 8,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    typeButtonTextActive: {
      color: '#fff',
    },
    inputSection: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      ...theme.shadow,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
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
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    clearButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.secondary,
      gap: 8,
    },
    clearButtonText: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    calculateButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.primary,
      gap: 8,
    },
    calculateButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: 'bold',
    },
    resultsSection: {
      marginBottom: 24,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: theme.secondary,
      borderRadius: 8,
      padding: 2,
    },
    toggleButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    toggleButtonActive: {
      backgroundColor: theme.primary,
    },
    toggleText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    toggleTextActive: {
      color: '#fff',
    },
    summaryCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      ...theme.shadow,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    summaryValueGross: {
      fontSize: 18,
      color: '#f57c00',
      fontWeight: 'bold',
    },
    summaryValueNet: {
      fontSize: 18,
      color: theme.primary,
      fontWeight: 'bold',
    },
    chartToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    chartToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      gap: 8,
      flex: 1,
      marginRight: 8,
      ...theme.shadow,
    },
    chartToggleText: {
      color: theme.text,
      fontWeight: '500',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.primary,
      borderRadius: 8,
      gap: 8,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '500',
    },
    chartsContainer: {
      marginBottom: 16,
    },
    chartCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
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
    },
    centerLabel: {
      fontSize: 12,
      color: theme.text,
      fontWeight: '600',
    },
    detailsCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      ...theme.shadow,
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingVertical: 4,
    },
    detailLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 8,
    },
    detailValue: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
      marginTop: 8,
    },
    totalLabel: {
      flex: 1,
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    totalValue: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: 'bold',
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