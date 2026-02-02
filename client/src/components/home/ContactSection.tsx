import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaCalendarCheck } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ServiceType } from "@shared/schema";

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  serviceId: z.string().optional(),
  message: z.string().min(1, { message: "Message is required" }),
  smsConsent: z.boolean().refine(val => val === true, {
    message: "SMS consent is required"
  })
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch services for the dropdown
  const { data: services } = useQuery<ServiceType[]>({
    queryKey: ["/api/services"],
  });

  // Check for briefId parameter and mark email as effective
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const briefId = urlParams.get('briefId');
    
    if (briefId) {
      console.log(`🎯 Contact page loaded with briefId: ${briefId}`);
      
      // Call the API to mark email as effective
      apiRequest("POST", "/api/staff/mark-effective", { briefId })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log(`✅ Email marked as effective for briefId: ${briefId}`);
          } else {
            console.log(`❌ Failed to mark email as effective: ${result.error}`);
          }
        })
        .catch(error => {
          console.error(`Error marking email as effective:`, error);
        });
    }
  }, []);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      serviceId: undefined,
      message: "",
      smsConsent: false
    }
  });
  
  const onSubmit = async (formValues: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Handle serviceId vs serviceType based on selection
      const values = {
        ...formValues,
        // Only set either serviceId or serviceType
        serviceId: formValues.serviceId === "other" 
          ? undefined 
          : formValues.serviceId 
            ? parseInt(formValues.serviceId) 
            : undefined,
        serviceType: formValues.serviceId === "other" ? "other" : undefined,
        smsConsent: formValues.smsConsent
      };
      
      console.log("Sending contact form data:", values);
      const response = await apiRequest("POST", "/api/contact", values);
      const result = await response.json();
      
      if (result.emailStatus) {
        const { notificationSent, autoReplySent, errors } = result.emailStatus;
        
        const baseMessage = notificationSent && autoReplySent 
          ? t("contact.form.emailSent")
          : errors && errors.length > 0 
            ? t("contact.form.emailIssues")
            : t("contact.form.messageSaved");
        
        const smsMessage = values.smsConsent 
          ? ` ${t("contact.form.smsOptInConfirmation")}`
          : "";
        
        if (notificationSent && autoReplySent) {
          toast({
            title: t("contact.form.success"),
            description: baseMessage + smsMessage,
            variant: "default",
          });
        } else if (errors && errors.length > 0) {
          console.warn("Email delivery issues:", errors);
          toast({
            title: t("contact.form.partialSuccess"),
            description: baseMessage + smsMessage,
            variant: "default",
          });
        } else {
          toast({
            title: t("contact.form.success"),
            description: baseMessage + smsMessage,
            variant: "default",
          });
        }
      } else {
        const baseMessage = t("contact.form.messageSaved");
        const smsMessage = values.smsConsent 
          ? ` ${t("contact.form.smsOptInConfirmation")}`
          : "";
        toast({
          title: t("contact.form.success"),
          description: baseMessage + smsMessage,
          variant: "default",
        });
      }
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        title: t("contact.form.error"),
        description: error instanceof Error ? error.message : t("contact.form.genericError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <section id="contact" className="py-16 bg-white dark:bg-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold font-['Poppins'] text-gray-900 dark:text-white mb-6">
              {t("contact.title")}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t("contact.subtitle")}
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.serviceType")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("contact.form.selectService")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services?.map((service) => (
                            <SelectItem key={service.id} value={String(service.id)}>
                              {language === 'es' && service.nameEs ? service.nameEs : service.name}
                            </SelectItem>
                          ))}
                          <SelectItem key="other" value="other">
                            {language === 'es' ? 'Otro' : 'Other'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.message")}</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="smsConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {t("contact.form.smsConsent")}
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full px-6 py-4 mt-4 bg-gray-800 dark:bg-primary-500 hover:bg-gray-900 dark:hover:bg-primary-600 focus:ring-4 focus:ring-gray-500 dark:focus:ring-primary-400 text-white font-bold text-lg rounded-lg transition-colors duration-200 shadow-lg border-2 border-transparent"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : t("contact.form.submit")}
                </Button>
              </form>
            </Form>
          </motion.div>
          
          {/* Contact Info */}
          <motion.div 
            className="flex flex-col justify-between"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl font-bold font-['Poppins'] text-gray-900 dark:text-white mb-6">
                {t("contact.info.title")}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                    <FaEnvelope className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("contact.info.email")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">sales@tobais.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                    <FaPhoneAlt className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("contact.info.phone")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <a 
                        href="https://wa.me/17042071760" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 mr-2 fill-current">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        +1 (704) 207-1760
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                    <FaMapMarkerAlt className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("contact.info.locations")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {t("contact.info.locationText")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("contact.info.connect")}
              </h3>
              
              <div className="flex space-x-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=638325699357067" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-2xl transition-colors" 
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook"></i>
                </a>
                <a 
                  href="https://www.instagram.com/tobais.official/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-2xl transition-colors" 
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a 
                  href="https://wa.me/17042071760" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-2xl transition-colors" 
                  aria-label="WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5 fill-current">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="mt-8 bg-primary-50 dark:bg-gray-700 rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900">
                  <FaCalendarCheck className="text-primary-600 dark:text-primary-300" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  {t("contact.info.schedule.title")}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t("contact.info.schedule.description")}
              </p>
              <a href="#" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium dark:text-primary-400 dark:hover:text-primary-300">
                <span>{t("contact.info.schedule.button")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
