import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Check, Crown, Zap, Shield, Calendar, Download, Sparkles, GraduationCap, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  listLivePlans,
  listSelfPacedPlans,
  listAllYTTRecordedPlans,
  listAllYTTLivePlans,
} from "../../api/plans";
import type { LivePlan, SelfPacedPlan, YTTPlan } from "../../api/types";

type UiPlan = {
  id: string;
  name: string;
  duration: string;
  price: number;
  monthlyPrice?: number;
  popular: boolean;
  badge?: string;
  features: string[];
  color: string;
};

const COLOR_DEFAULT = "#ff691d";

const formatValidity = (days: number) => {
  if (days <= 31) return "month";
  if (days <= 95) return "3 months";
  if (days <= 190) return "6 months";
  if (days <= 380) return "12 months";
  return `${days} days`;
};

const toNumber = (v: string | number): number => (typeof v === "number" ? v : Number(v));

const livePlanToUi = (p: LivePlan): UiPlan => ({
  id: p.id,
  name: p.name,
  duration: formatValidity(p.validity),
  price: toNumber(p.price),
  popular: false,
  features: p.features,
  color: COLOR_DEFAULT,
});

const selfPacedToUi = (p: SelfPacedPlan): UiPlan => ({
  id: p.id,
  name: p.name,
  duration: formatValidity(p.validity),
  price: toNumber(p.price),
  popular: false,
  features: p.features,
  color: COLOR_DEFAULT,
});

const yttPlanToUi = (plan: YTTPlan): UiPlan => ({
  id: plan.id,
  name: plan.name,
  duration: formatValidity(plan.validity),
  price: toNumber(plan.price),
  popular: false,
  features: plan.features,
  color: COLOR_DEFAULT,
});

export function UserPayments() {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<UiPlan | null>(null);
  const [activeTab, setActiveTab] = useState("live-classes");
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [livePlans, setLivePlans] = useState<UiPlan[]>([]);
  const [selfPacedPlans, setSelfPacedPlans] = useState<UiPlan[]>([]);
  const [yttSelfPacedPlans, setYttSelfPacedPlans] = useState<UiPlan[]>([]);
  const [yttLivePlans, setYttLivePlans] = useState<UiPlan[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPlans(true);
    (async () => {
      try {
        const [live, selfPaced, yttRecorded, yttLive] = await Promise.all([
          listLivePlans("STUDENT"),
          listSelfPacedPlans("STUDENT"),
          listAllYTTRecordedPlans("STUDENT"),
          listAllYTTLivePlans("STUDENT"),
        ]);
        if (cancelled) return;

        setLivePlans(live.filter((p) => p.isActive).map(livePlanToUi));
        setSelfPacedPlans(selfPaced.filter((p) => p.isActive).map(selfPacedToUi));
        setYttSelfPacedPlans(yttRecorded.filter((p) => p.isActive).map(yttPlanToUi));
        setYttLivePlans(yttLive.filter((p) => p.isActive).map(yttPlanToUi));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load plans.");
        }
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlan = {
    name: 'Live Yoga - Monthly (Inaugural)',
    price: 499,
    billingCycle: 'monthly',
    startDate: 'Jan 10, 2026',
    nextBilling: 'May 10, 2026',
    status: 'active',
    category: 'Live Classes',
    features: [
      'Unlimited live class access',
      'Real-time instructor guidance',
      'Priority booking',
      'Personal progress tracking',
      'Mobile app access',
      'Community support'
    ]
  };
 
  const paymentHistory = [
    { id: 1, date: 'Apr 10, 2026', amount: 499, plan: 'Live Yoga - Monthly (Inaugural)', status: 'paid', method: 'Credit Card ****1234' },
    { id: 2, date: 'Mar 10, 2026', amount: 499, plan: 'Live Yoga - Monthly (Inaugural)', status: 'paid', method: 'Credit Card ****1234' },
    { id: 3, date: 'Feb 10, 2026', amount: 499, plan: 'Live Yoga - Monthly (Inaugural)', status: 'paid', method: 'Credit Card ****1234' },
    { id: 4, date: 'Jan 10, 2026', amount: 499, plan: 'Live Yoga - Monthly (Inaugural)', status: 'paid', method: 'Credit Card ****1234' },
  ];

  const handleUpgrade = (plan: UiPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
 
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl mb-8 p-8 md:p-12"
        style={{
          background: 'linear-gradient(135deg, #ff691d 0%, #610981 100%)'
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Subscription Plans
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/90 text-lg max-w-2xl"
          >
            Choose the perfect plan for your yoga journey. From live interactive classes to self-paced programs and professional teacher training.
          </motion.p>
 
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm text-white/80">Active Plan</p>
              <p className="font-semibold text-white">{currentPlan.name}</p>
            </div>
            <Badge className="ml-2 bg-green-500 text-white border-0">Active</Badge>
          </motion.div>
        </div>
      </motion.div>
 
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid p-1 h-auto bg-gray-100 rounded-2xl">
          <TabsTrigger 
            value="live-classes" 
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <Zap className="w-4 h-4 mr-2" />
            Live Classes
          </TabsTrigger>
          <TabsTrigger 
            value="self-paced" 
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <Heart className="w-4 h-4 mr-2" />
            Self-Paced
          </TabsTrigger>
          <TabsTrigger 
            value="teacher-training" 
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Teacher Training
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="live-classes" className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Live Yoga Classes
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Pick a validity that fits your practice
                </p>
              </div>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              {livePlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card 
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border-2 h-full group"
                    style={plan.popular ? { borderColor: plan.color } : {}}
                  >
                    {plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
 
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                          <Zap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          for {plan.duration}
                        </p>
                        {plan.monthlyPrice && (
                          <p className="text-xs text-muted-foreground mt-1">
                            (₹{plan.monthlyPrice}/month)
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full py-6 text-base font-semibold rounded-xl"
                        style={{ 
                          backgroundColor: plan.color,
                          color: 'white'
                        }}
                        onClick={() => handleUpgrade(plan)}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
 
        </TabsContent>

        <TabsContent value="self-paced" className="space-y-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                Self-Paced Yoga Programs
              </h2>
              <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                Learn at your own pace with recorded sessions and lifetime access
              </p>
            </div>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {selfPacedPlans.map((plan) => (
              <motion.div key={plan.id} variants={item}>
                <Card 
                  className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border h-full group"
                  style={plan.popular ? { borderColor: plan.color, borderWidth: '2px' } : {}}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  {plan.popular && !plan.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div 
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: plan.color }}
                  />
                  
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                        <Heart className="w-6 h-6" style={{ color: plan.color }} />
                      </div>
                      <CardTitle className="text-2xl" style={{ color: plan.color }}>
                        {plan.name}
                      </CardTitle>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">₹{plan.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        for {plan.duration}
                      </p>
                      {plan.monthlyPrice && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (₹{plan.monthlyPrice}/month)
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Check className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                          </div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full py-6 text-base font-semibold rounded-xl"
                      style={{ 
                        backgroundColor: plan.color,
                        color: 'white'
                      }}
                      onClick={() => handleUpgrade(plan)}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
 
        <TabsContent value="teacher-training" className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Yoga Teacher Training - Self-Paced
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Become a certified yoga instructor at your own pace
                </p>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-3"
            >
              {yttSelfPacedPlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card 
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border h-full group"
                    style={plan.badge ? { borderColor: plan.color, borderWidth: '2px' } : {}}
                  >
                    {plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                          <GraduationCap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.duration}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full py-6 text-base font-semibold rounded-xl"
                        style={{ 
                          backgroundColor: plan.color,
                          color: 'white'
                        }}
                        onClick={() => handleUpgrade(plan)}
                      >
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
 
          <div className="pt-8 border-t">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Yoga Teacher Training - Live Sessions
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Interactive live training with expert instructors and personal mentorship
                </p>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-3"
            >
              {yttLivePlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card 
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border-2 h-full group"
                    style={{ borderColor: plan.color }}
                  >
                    {plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${plan.color}40, ${plan.color}20)` }}>
                          <GraduationCap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.duration}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full py-6 text-base font-semibold rounded-xl shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                          color: 'white'
                        }}
                        onClick={() => handleUpgrade(plan)}
                      >
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
 
      <div className="mt-12">

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: '#ff691d' }}>Recent Payments</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentHistory.map((payment, index) => (
                  <motion.div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{payment.plan}</span>
                        <span className="font-semibold">₹{payment.amount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{payment.date}</span>
                        <Badge 
                          className="text-xs"
                          style={{ 
                            backgroundColor: '#10b98120', 
                            color: '#10b981' 
                          }}
                        >
                          Paid
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  View All Payment History
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
 
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Subscribe to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Review your plan details and confirm your subscription
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2" style={{ borderColor: selectedPlan.color }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{selectedPlan.name} Plan</h4>
                  <Badge style={{ backgroundColor: `${selectedPlan.color}20`, color: selectedPlan.color }}>
                    {selectedPlan.duration}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">₹{selectedPlan.price}</span>
                  {selectedPlan.monthlyPrice && (
                    <span className="text-sm text-muted-foreground">(₹{selectedPlan.monthlyPrice}/month)</span>
                  )}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Key Features:</p>
                  <ul className="space-y-1">
                    {selectedPlan.features.slice(0, 4).map((feature: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: selectedPlan.color }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button style={{ backgroundColor: selectedPlan?.color, color: 'white' }}>
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
