export interface EMICalculationParams {
  principal: number;
  interestRate: number; // Annual rate in percentage
  tenure: number; // In months
  interestType: 'flat' | 'reducing';
  startDate: string;
  frequency: 'monthly' | 'weekly';
}

export interface EMIScheduleItem {
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalAmount: number;
  interestAmount: number;
  outstandingBalance: number;
}

export function calculateEMISchedule(params: EMICalculationParams): EMIScheduleItem[] {
  const { principal, interestRate, tenure, interestType, startDate, frequency } = params;
  
  const monthlyRate = interestRate / (12 * 100);
  const schedule: EMIScheduleItem[] = [];
  
  let outstandingPrincipal = principal;
  const startDateObj = new Date(startDate);
  
  if (interestType === 'flat') {
    // Flat rate calculation
    const totalInterest = (principal * interestRate * tenure) / (12 * 100);
    const emiAmount = (principal + totalInterest) / tenure;
    const interestPerEmi = totalInterest / tenure;
    const principalPerEmi = principal / tenure;
    
    for (let i = 0; i < tenure; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      outstandingPrincipal -= principalPerEmi;
      
      schedule.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        emiAmount: Math.round(emiAmount),
        principalAmount: Math.round(principalPerEmi),
        interestAmount: Math.round(interestPerEmi),
        outstandingBalance: Math.round(Math.max(0, outstandingPrincipal)),
      });
    }
  } else {
    // Reducing balance calculation
    const emiAmount = calculateReducingBalanceEMI(principal, monthlyRate, tenure);
    
    for (let i = 0; i < tenure; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      const interestAmount = outstandingPrincipal * monthlyRate;
      const principalAmount = emiAmount - interestAmount;
      outstandingPrincipal -= principalAmount;
      
      schedule.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        emiAmount: Math.round(emiAmount),
        principalAmount: Math.round(principalAmount),
        interestAmount: Math.round(interestAmount),
        outstandingBalance: Math.round(Math.max(0, outstandingPrincipal)),
      });
    }
  }
  
  return schedule;
}

function calculateReducingBalanceEMI(principal: number, monthlyRate: number, tenure: number): number {
  if (monthlyRate === 0) {
    return principal / tenure;
  }
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  
  return emi;
}

export function calculatePenalty(
  emiAmount: number,
  dueDate: string,
  gracePeriod: number = 0,
  penaltyRate: number = 2 // percentage per day
): number {
  const dueDateObj = new Date(dueDate);
  const currentDate = new Date();
  const gracePeriodEnd = new Date(dueDateObj);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriod);
  
  if (currentDate <= gracePeriodEnd) {
    return 0;
  }
  
  const overdueDays = Math.floor(
    (currentDate.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const penalty = (emiAmount * penaltyRate * overdueDays) / 100;
  return Math.round(penalty);
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN').format(num);
}
