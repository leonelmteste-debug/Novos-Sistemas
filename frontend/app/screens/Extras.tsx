import React, { useState, useContext, useEffect } from 'react';
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
import Slider from '@react-native-community/slider';
import { ThemeContext } from '../context/ThemeContext';

export default function Extras() {
  const { theme } = useContext(ThemeContext);
  
  // 13th Salary Calculator
  const [thirteenthSalary, setThirteenthSalary] = useState({
    monthlySalary: '',
    monthsWorked: '',
    result: null as any,
  });

  // Overtime Calculator
  const [overtime, setOvertime] = useState({
    baseSalary: '',
    normalHours: '160', // Standard 160 hours/month
    overtimeHours: '',
    overtimeRate: '50', // 50% extra
    nightHours: '',
    nightRate: '25', // 25% extra for night shift
    holidayHours: '',
    holidayRate: '100', // 100% extra for holidays
    result: null as any,
  });

  // Currency Exchange Calculator
  const [currencyExchange, setCurrencyExchange] = useState({
    amount: '',
    fromCurrency: 'USD',
    toCurrency: 'MZN',
    manualRate: '',
    useManualRate: false,
    result: null as any,
    isLoading: false,
  });

  // Bonus Calculator
  const [bonusCalculator, setBonusCalculator] = useState({
    baseSalary: '',
    performanceScore: 85, // Slider value 0-100
    bonusPercentage: '10',
    fixedBonusAmount: '',
    useFixedAmount: false,
    result: null as any,
  });

  const formatCurrency = (value: number, currency = 'MTn') => {
    return `${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  // 13th Salary Calculation
  const calculateThirteenthSalary = () => {
    const monthly = parseFloat(thirteenthSalary.monthlySalary);
    const months = parseFloat(thirteenthSalary.monthsWorked) || 12;

    if (!monthly) {
      Alert.alert('Erro', 'Por favor, insira o salário mensal');
      return;
    }

    const thirteenth = (monthly * months) / 12;
    const proportional = months < 12;

    setThirteenthSalary(prev => ({
      ...prev,
      result: {
        monthlySalary: monthly,
        monthsWorked: months,
        thirteenthValue: thirteenth,
        isProportional: proportional,
        yearEndBonus: monthly, // Full month salary as year-end bonus
        total: thirteenth + (monthly * 0.1), // Including estimated bonus
      },
    }));
  };

  // Overtime Calculation
  const calculateOvertime = () => {
    const base = parseFloat(overtime.baseSalary);
    const normal = parseFloat(overtime.normalHours);
    const overtimeHrs = parseFloat(overtime.overtimeHours) || 0;
    const nightHrs = parseFloat(overtime.nightHours) || 0;
    const holidayHrs = parseFloat(overtime.holidayHours) || 0;
    const overtimeRate = parseFloat(overtime.overtimeRate) / 100;
    const nightRate = parseFloat(overtime.nightRate) / 100;
    const holidayRate = parseFloat(overtime.holidayRate) / 100;

    if (!base || !normal) {
      Alert.alert('Erro', 'Por favor, insira o salário base e horas normais');
      return;
    }

    const hourlyRate = base / normal;
    const overtimePay = overtimeHrs * hourlyRate * (1 + overtimeRate);
    const nightPay = nightHrs * hourlyRate * (1 + nightRate);
    const holidayPay = holidayHrs * hourlyRate * (1 + holidayRate);
    const totalExtra = overtimePay + nightPay + holidayPay;
    const totalSalary = base + totalExtra;

    setOvertime(prev => ({
      ...prev,
      result: {
        baseSalary: base,
        hourlyRate,
        overtimePay,
        nightPay,
        holidayPay,
        totalExtra,
        totalSalary,
        breakdown: {
          normal: { hours: normal, rate: hourlyRate, total: base },
          overtime: { hours: overtimeHrs, rate: hourlyRate * (1 + overtimeRate), total: overtimePay },
          night: { hours: nightHrs, rate: hourlyRate * (1 + nightRate), total: nightPay },
          holiday: { hours: holidayHrs, rate: hourlyRate * (1 + holidayRate), total: holidayPay },
        },
      },
    }));
  };

  // Currency Exchange
  const exchangeRates = {
    'USD-MZN': 63.50,
    'EUR-MZN': 70.25,
    'ZAR-MZN': 3.45,
    'GBP-MZN': 82.15,
  };

  const calculateCurrencyExchange = () => {
    const amount = parseFloat(currencyExchange.amount);
    if (!amount) {
      Alert.alert('Erro', 'Por favor, insira o valor a converter');
      return;
    }

    let rate: number;
    if (currencyExchange.useManualRate && currencyExchange.manualRate) {
      rate = parseFloat(currencyExchange.manualRate);
    } else {
      const rateKey = `${currencyExchange.fromCurrency}-${currencyExchange.toCurrency}`;
      const reverseKey = `${currencyExchange.toCurrency}-${currencyExchange.fromCurrency}`;
      
      if (exchangeRates[rateKey as keyof typeof exchangeRates]) {
        rate = exchangeRates[rateKey as keyof typeof exchangeRates];
      } else if (exchangeRates[reverseKey as keyof typeof exchangeRates]) {
        rate = 1 / exchangeRates[reverseKey as keyof typeof exchangeRates];
      } else {
        rate = 1; // Same currency
      }
    }

    const convertedAmount = amount * rate;

    setCurrencyExchange(prev => ({
      ...prev,
      result: {
        originalAmount: amount,
        convertedAmount,
        rate,
        fromCurrency: currencyExchange.fromCurrency,
        toCurrency: currencyExchange.toCurrency,
      },
    }));
  };

  // Bonus Calculator
  const calculateBonus = () => {
    const base = parseFloat(bonusCalculator.baseSalary);
    if (!base) {
      Alert.alert('Erro', 'Por favor, insira o salário base');
      return;
    }

    let bonusAmount: number;

    if (bonusCalculator.useFixedAmount && bonusCalculator.fixedBonusAmount) {
      bonusAmount = parseFloat(bonusCalculator.fixedBonusAmount);
    } else {
      const percentage = parseFloat(bonusCalculator.bonusPercentage) / 100;
      const performanceMultiplier = bonusCalculator.performanceScore / 100;
      bonusAmount = base * percentage * performanceMultiplier;
    }

    const totalWithBonus = base + bonusAmount;
    const performanceRating = 
      bonusCalculator.performanceScore >= 90 ? 'Excelente' :
      bonusCalculator.performanceScore >= 80 ? 'Muito Bom' :
      bonusCalculator.performanceScore >= 70 ? 'Bom' :
      bonusCalculator.performanceScore >= 60 ? 'Satisfatório' : 'Insatisfatório';

    setBonusCalculator(prev => ({
      ...prev,
      result: {
        baseSalary: base,
        bonusAmount,
        totalWithBonus,
        performanceScore: bonusCalculator.performanceScore,
        performanceRating,
        bonusPercentage: (bonusAmount / base) * 100,
      },
    }));
  };

  const styles = getStyles(theme);

  const renderThirteenthSalaryCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.calculatorHeader}>
        <MaterialIcons name="card-giftcard" size={24} color={theme.primary} />
        <Text style={styles.calculatorTitle}>13º Salário</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Salário Mensal (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={thirteenthSalary.monthlySalary}
          onChangeText={(text) => setThirteenthSalary(prev => ({ ...prev, monthlySalary: text }))}
          placeholder="Ex: 45000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meses Trabalhados (opcional - padrão: 12)</Text>
        <TextInput
          style={styles.textInput}
          value={thirteenthSalary.monthsWorked}
          onChangeText={(text) => setThirteenthSalary(prev => ({ ...prev, monthsWorked: text }))}
          placeholder="12"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculateThirteenthSalary}>
        <MaterialIcons name="calculate" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Calcular 13º</Text>
      </TouchableOpacity>

      {thirteenthSalary.result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultado do 13º Salário</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Valor do 13º:</Text>
            <Text style={styles.resultValueNet}>
              {formatCurrency(thirteenthSalary.result.thirteenthValue)}
            </Text>
          </View>
          {thirteenthSalary.result.isProportional && (
            <Text style={styles.resultNote}>
              Valor proporcional a {thirteenthSalary.result.monthsWorked} meses
            </Text>
          )}
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Base:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(thirteenthSalary.result.monthlySalary)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total com Bônus:</Text>
            <Text style={styles.resultValueGross}>
              {formatCurrency(thirteenthSalary.result.total)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderOvertimeCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.calculatorHeader}>
        <MaterialIcons name="access-time" size={24} color={theme.primary} />
        <Text style={styles.calculatorTitle}>Horas Extras</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Salário Base (MTn)</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.baseSalary}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, baseSalary: text }))}
            placeholder="45000"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Horas Normais</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.normalHours}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, normalHours: text }))}
            placeholder="160"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Horas Extras</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.overtimeHours}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, overtimeHours: text }))}
            placeholder="20"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Taxa Extra (%)</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.overtimeRate}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, overtimeRate: text }))}
            placeholder="50"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Horas Noturnas</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.nightHours}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, nightHours: text }))}
            placeholder="10"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Horas Feriado</Text>
          <TextInput
            style={styles.textInput}
            value={overtime.holidayHours}
            onChangeText={(text) => setOvertime(prev => ({ ...prev, holidayHours: text }))}
            placeholder="8"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculateOvertime}>
        <MaterialIcons name="schedule" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Calcular Horas</Text>
      </TouchableOpacity>

      {overtime.result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultado das Horas Extras</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Base:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(overtime.result.baseSalary)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Horas Extras:</Text>
            <Text style={styles.resultValueGross}>
              +{formatCurrency(overtime.result.overtimePay)}
            </Text>
          </View>
          {overtime.result.nightPay > 0 && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Adicional Noturno:</Text>
              <Text style={styles.resultValueGross}>
                +{formatCurrency(overtime.result.nightPay)}
              </Text>
            </View>
          )}
          {overtime.result.holidayPay > 0 && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Adicional Feriado:</Text>
              <Text style={styles.resultValueGross}>
                +{formatCurrency(overtime.result.holidayPay)}
              </Text>
            </View>
          )}
          <View style={[styles.resultRow, styles.totalRow]}>
            <Text style={styles.resultLabelTotal}>Salário Total:</Text>
            <Text style={styles.resultValueNet}>
              {formatCurrency(overtime.result.totalSalary)}
            </Text>
          </View>
          <Text style={styles.resultNote}>
            Taxa horária: {formatCurrency(overtime.result.hourlyRate)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCurrencyExchange = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.calculatorHeader}>
        <MaterialIcons name="currency-exchange" size={24} color={theme.primary} />
        <Text style={styles.calculatorTitle}>Conversor de Moeda</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Valor a Converter</Text>
        <TextInput
          style={styles.textInput}
          value={currencyExchange.amount}
          onChangeText={(text) => setCurrencyExchange(prev => ({ ...prev, amount: text }))}
          placeholder="1000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>De</Text>
          <View style={styles.currencySelector}>
            {['USD', 'EUR', 'ZAR', 'GBP', 'MZN'].map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyButton,
                  currencyExchange.fromCurrency === currency && styles.currencyButtonActive
                ]}
                onPress={() => setCurrencyExchange(prev => ({ ...prev, fromCurrency: currency }))}
              >
                <Text style={[
                  styles.currencyButtonText,
                  currencyExchange.fromCurrency === currency && styles.currencyButtonTextActive
                ]}>{currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Para</Text>
          <View style={styles.currencySelector}>
            {['MZN', 'USD', 'EUR', 'ZAR', 'GBP'].map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyButton,
                  currencyExchange.toCurrency === currency && styles.currencyButtonActive
                ]}
                onPress={() => setCurrencyExchange(prev => ({ ...prev, toCurrency: currency }))}
              >
                <Text style={[
                  styles.currencyButtonText,
                  currencyExchange.toCurrency === currency && styles.currencyButtonTextActive
                ]}>{currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.manualRateContainer}>
        <TouchableOpacity
          style={styles.manualRateToggle}
          onPress={() => setCurrencyExchange(prev => ({ ...prev, useManualRate: !prev.useManualRate }))}
        >
          <MaterialIcons 
            name={currencyExchange.useManualRate ? "check-box" : "check-box-outline-blank"} 
            size={20} 
            color={theme.primary} 
          />
          <Text style={styles.manualRateText}>Usar taxa personalizada</Text>
        </TouchableOpacity>
        
        {currencyExchange.useManualRate && (
          <TextInput
            style={styles.textInput}
            value={currencyExchange.manualRate}
            onChangeText={(text) => setCurrencyExchange(prev => ({ ...prev, manualRate: text }))}
            placeholder="63.50"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        )}
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculateCurrencyExchange}>
        <MaterialIcons name="swap-horiz" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Converter</Text>
      </TouchableOpacity>

      {currencyExchange.result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultado da Conversão</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              {formatCurrency(currencyExchange.result.originalAmount, currencyExchange.result.fromCurrency)}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={theme.textSecondary} />
            <Text style={styles.resultValueNet}>
              {formatCurrency(currencyExchange.result.convertedAmount, currencyExchange.result.toCurrency)}
            </Text>
          </View>
          <Text style={styles.resultNote}>
            Taxa: 1 {currencyExchange.result.fromCurrency} = {currencyExchange.result.rate.toFixed(4)} {currencyExchange.result.toCurrency}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBonusCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.calculatorHeader}>
        <MaterialIcons name="emoji-events" size={24} color={theme.primary} />
        <Text style={styles.calculatorTitle}>Calculadora de Bônus</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Salário Base (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={bonusCalculator.baseSalary}
          onChangeText={(text) => setBonusCalculator(prev => ({ ...prev, baseSalary: text }))}
          placeholder="45000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.performanceContainer}>
        <Text style={styles.inputLabel}>
          Pontuação de Desempenho: {bonusCalculator.performanceScore}%
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={bonusCalculator.performanceScore}
          onValueChange={(value) => setBonusCalculator(prev => ({ ...prev, performanceScore: Math.round(value) }))}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.border}
          thumbStyle={{ backgroundColor: theme.primary }}
          step={5}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0%</Text>
          <Text style={styles.sliderLabel}>50%</Text>
          <Text style={styles.sliderLabel}>100%</Text>
        </View>
      </View>

      <View style={styles.bonusTypeContainer}>
        <TouchableOpacity
          style={styles.bonusTypeToggle}
          onPress={() => setBonusCalculator(prev => ({ ...prev, useFixedAmount: !prev.useFixedAmount }))}
        >
          <MaterialIcons 
            name={bonusCalculator.useFixedAmount ? "radio-button-checked" : "radio-button-unchecked"} 
            size={20} 
            color={theme.primary} 
          />
          <Text style={styles.bonusTypeText}>Usar valor fixo</Text>
        </TouchableOpacity>
      </View>

      {bonusCalculator.useFixedAmount ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Valor Fixo do Bônus (MTn)</Text>
          <TextInput
            style={styles.textInput}
            value={bonusCalculator.fixedBonusAmount}
            onChangeText={(text) => setBonusCalculator(prev => ({ ...prev, fixedBonusAmount: text }))}
            placeholder="5000"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Porcentagem do Bônus (%)</Text>
          <TextInput
            style={styles.textInput}
            value={bonusCalculator.bonusPercentage}
            onChangeText={(text) => setBonusCalculator(prev => ({ ...prev, bonusPercentage: text }))}
            placeholder="10"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateBonus}>
        <MaterialIcons name="star" size={20} color="#fff" />
        <Text style={styles.calculateButtonText}>Calcular Bônus</Text>
      </TouchableOpacity>

      {bonusCalculator.result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultado do Bônus</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Desempenho:</Text>
            <Text style={[styles.resultValue, { color: 
              bonusCalculator.result.performanceScore >= 80 ? '#4caf50' : 
              bonusCalculator.result.performanceScore >= 60 ? '#ff9800' : '#f44336' 
            }]}>
              {bonusCalculator.result.performanceRating}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Salário Base:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(bonusCalculator.result.baseSalary)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Bônus:</Text>
            <Text style={styles.resultValueGross}>
              {formatCurrency(bonusCalculator.result.bonusAmount)}
            </Text>
          </View>
          <View style={[styles.resultRow, styles.totalRow]}>
            <Text style={styles.resultLabelTotal}>Total:</Text>
            <Text style={styles.resultValueNet}>
              {formatCurrency(bonusCalculator.result.totalWithBonus)}
            </Text>
          </View>
          <Text style={styles.resultNote}>
            Bônus equivale a {bonusCalculator.result.bonusPercentage.toFixed(1)}% do salário
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialIcons name="more-horiz" size={32} color={theme.primary} />
          <Text style={styles.title}>Calculadoras Extras</Text>
          <Text style={styles.subtitle}>13º salário, horas extras e mais</Text>
        </View>

        {renderThirteenthSalaryCalculator()}
        {renderOvertimeCalculator()}
        {renderBonusCalculator()}
        {renderCurrencyExchange()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Calculadoras adicionais para complementar seu planejamento salarial
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
    calculatorCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadow,
    },
    calculatorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    calculatorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputGroupHalf: {
      flex: 1,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
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
    calculateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.primary,
      gap: 8,
      marginTop: 8,
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
      marginTop: 16,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
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
    resultLabelTotal: {
      fontSize: 16,
      color: theme.text,
      fontWeight: 'bold',
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
    resultNote: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginTop: 8,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 8,
      marginTop: 8,
    },
    currencySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    currencyButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
    },
    currencyButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    currencyButtonText: {
      fontSize: 12,
      color: theme.text,
      fontWeight: '500',
    },
    currencyButtonTextActive: {
      color: '#fff',
    },
    manualRateContainer: {
      marginBottom: 16,
    },
    manualRateToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    manualRateText: {
      fontSize: 14,
      color: theme.text,
    },
    performanceContainer: {
      marginBottom: 16,
    },
    slider: {
      width: '100%',
      height: 40,
      marginVertical: 8,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    sliderLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    bonusTypeContainer: {
      marginBottom: 16,
    },
    bonusTypeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bonusTypeText: {
      fontSize: 14,
      color: theme.text,
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