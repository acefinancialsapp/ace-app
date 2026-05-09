import { aceConstants } from "@/constants/aceConstants";
import { endpointConstants } from "@/constants/endpoint";
import { useHttp } from "@/services/app.services";
import { Picker } from "@react-native-picker/picker";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useRoute } from "@react-navigation/native";
import Checkbox from "expo-checkbox";
import { useNavigation } from "expo-router";
import React, { PropsWithChildren, useEffect, useState,useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { navigate } from "expo-router/build/global-state/routing";
import { getCompUrl, getToken } from "@/services/common.services";
import * as FileSystem from 'expo-file-system/legacy';
import {shareAsync} from 'expo-sharing';
import { Platform } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import * as IntentLauncher from 'expo-intent-launcher';

const { width } = Dimensions.get("window");
  
function DetailsTab(props: PropsWithChildren<{ dataItem: any }>) {
  type DetailItem = {
    id: number;
    co: string;
    receivedfrom: string;
    document: string;
    docno: string;
    dated: string;
    name: string;
    detail: string;
    ref: string;
    amount: string;
    attach: string;
    isapprove: boolean;
    forrole: string;
  };

  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  type ItemDetail = {
    AutoNum: number;
    Detail: string;
    SNo: number;
    Locn: string;
    Item: string;
    Unit: string;
    Qty: number;
    Price: number;
    Dis: number;
    Amount: number;
    Oh: number;
    Delivery: string;
    Issued_Qty: number;
    OnHand: number;
    LQty: number;
    LDate: string | null;
    LPrice: number;
    Rate2: string;
    Rate3: string;
    Supp2: string;
    Supp3: string;
  };

  const [ApprovalDetailData, setApprovalDetailData] = useState<[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const useHttpService = useHttp();
  useEffect(() => {
    apiData();
  }, []);
  const extractedKeys: string[] = useMemo(() => {
  if (!ApprovalDetailData || !Array.isArray(ApprovalDetailData)) return [];

  const allKeys = new Set<string>();

  ApprovalDetailData.forEach(obj => {
    Object.keys(obj || {}).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys);
}, [ApprovalDetailData]);
  const apiData = async () => {
    setIsLoading(true);
    try {
         const compUrl =  await getCompUrl();
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVALDETAILBYDOC}/${props.dataItem.ModuleID}/${props.dataItem.CompID}/${props.dataItem.Year}/${props.dataItem.DocType}/${props.dataItem.DocNo}/${props.dataItem.Autonum}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {

            setApprovalDetailData(response.Data);
          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
    
  };
 


  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
      <ScrollView>
       {ApprovalDetailData?.map((item, index) => (

    <View style={styles.rowborder}>
      {
 extractedKeys?.map((keyName:string) => (
        <View key={keyName} style={{ flexDirection: "row", marginBottom: 6 }}>
          <Text style={{ flex: 1, fontWeight: "bold",color: "#04447c" }}>
            {keyName}:
          </Text>

          <Text style={{ flex: 2 }}>
            {item[keyName] ?? "-"}
          </Text>
        </View>
      ))}
    </View>
))}

      </ScrollView>

      </>
      )}
    </View>
  );
}


function AttachmentsTab(props: PropsWithChildren<{ dataItem: any }>) {
  const useHttpService = useHttp();
  const [isLoading, setIsLoading] = useState(false);
  const openFile = async (fileUri:any, mimeType:any) => {
  const dataUri= await FileSystem.getContentUriAsync(fileUri);
  try {
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: dataUri,
    type: mimeType,
    flags: 1,

  });
  } catch (error) {
    console.error("Please Install the required app to view this file.", error);
  }
};
    const openLink = async (fileName: string) => {
    setIsLoading(true);
    try {
      const compUrl = await getCompUrl();
      // download file to app document directory
      const response: any = await FileSystem.downloadAsync(
        `${compUrl}/api/${endpointConstants.DOWNLOADATTACHMENT}/${props.dataItem.CompID}/${props.dataItem.Autonum}`,
        FileSystem.documentDirectory + fileName,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      const localUri = response.uri;
     if (Platform.OS === "android") {
        try {
            const ext = (localUri.split('.').pop() || '').toLowerCase();
            const mimeTypeMap: Record<string, string> = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            txt: 'text/plain',
            csv: 'text/csv',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            mp4: 'video/mp4',
            mp3: 'audio/mpeg',
            };
            const options = {
            mimeType: mimeTypeMap[ext] || 'application/octet-stream',
            dialogTitle: 'view this file',
            };
          console.log('Content URI:', options);
         await  openFile(localUri,options.mimeType);
        } catch (err) {
          // fallback
        }
      } else {
        await shareAsync(localUri);
      }
    } catch (err) {
      console.error("Error opening file", err);
    } finally {
      setIsLoading(false);
    }
  };

  // const save=async(URI:any,url:string)=>{
  //   if(Platform.OS==="android")
  //   {
  //     const permission= await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  //     if(permission.granted){
  //       const base64= await FileSystem.readAsStringAsync(URI,{encoding:FileSystem.EncodingType.Base64});
  //       try {
  //         const ext = (url.split('.').pop() || '').toLowerCase();
  //         const mimeMap: Record<string, string> = {
  //           pdf: 'application/pdf',
  //           jpg: 'image/jpeg',
  //           jpeg: 'image/jpeg',
  //           png: 'image/png',
  //           gif: 'image/gif',
  //           txt: 'text/plain',
  //           csv: 'text/csv',
  //           doc: 'application/msword',
  //           docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //           xls: 'application/vnd.ms-excel',
  //           xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //           mp4: 'video/mp4',
  //           mp3: 'audio/mpeg',
  //         };
  //         const mimeType = mimeMap[ext] || 'application/octet-stream';

  //         const uri = await FileSystem.StorageAccessFramework.createFileAsync(
  //           permission.directoryUri,
  //           url,
  //           mimeType
  //         );

  //         await FileSystem.writeAsStringAsync(uri, base64, {
  //           encoding: FileSystem.EncodingType.Base64,
  //         });
  //       } catch (err) {
  //         console.error('Error saving file to storage access framework', err);
  //       }
  //     }
  //   }
  //   else{
  //   shareAsync(URI);
  //   }
  // }

//  const openFile = async (remoteUrl: string, preferredName?: string) => {
//     setIsLoading(true);
//     try {
//       // choose a filename
//       const filename = preferredName || remoteUrl.split("/").pop() || `file_${Date.now()}`;
//       const localUri = `${FileSystem.documentDirectory}${filename}`;

//       // if remoteUrl is already a remote url, download it; otherwise assume it's a usable uri
//       if (remoteUrl?.startsWith("http")) {
//         // download if not already exists
//         const info = await FileSystem.getInfoAsync(localUri);
//         if (!info.exists) {
//           const compUrl = await getCompUrl();
//           // if your backend requires a specific download endpoint use it here,
//           // otherwise remoteUrl can be used directly.
//           const downloadUrl =
//             remoteUrl.startsWith("http") && remoteUrl.includes("/api/")
//               ? remoteUrl
//               : `${remoteUrl}`; // fallback to remoteUrl

//           await FileSystem.downloadAsync(downloadUrl, localUri, {
//             headers: { Authorization: `Bearer ${await getToken()}` },
//           });
//         }
//       }

//       // Open with system viewer: on Android use content URI, otherwise shareAsync with file://
//       if (Platform.OS === "android") {
//         try {
//           const contentUri = await FileSystem.getContentUriAsync(localUri);
//             // const ext = (localUri.split('.').pop() || '').toLowerCase();
//             // const mimeTypeMap: Record<string, string> = {
//             // pdf: 'application/pdf',
//             // jpg: 'image/jpeg',
//             // jpeg: 'image/jpeg',
//             // png: 'image/png',
//             // gif: 'image/gif',
//             // txt: 'text/plain',
//             // csv: 'text/csv',
//             // doc: 'application/msword',
//             // docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             // xls: 'application/vnd.ms-excel',
//             // xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//             // mp4: 'video/mp4',
//             // mp3: 'audio/mpeg',
//             // };
//             // const options = {
//             // mimeType: mimeTypeMap[ext] || 'application/octet-stream',
//             // dialogTitle: 'Share this file',
//             // };
//           await shareAsync(contentUri);
//         } catch (err) {
//           // fallback
//         }
//       } else {
//         await shareAsync(localUri);
//       }
//     } catch (err) {
//       console.error("Error opening file", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

  type AttachmentItem = {
    CompID: string;
    Year: string;
    DocType: string;
    DocNo: string;
    UserDescription: string;
    FileName: string;
    InternalFileName: string;
    SlNo: string;
    Validity: string;
  };
  const [attachmentsData, setattachmentsData] = useState<AttachmentItem[]>([]);

  useEffect(() => {
    apiData();
  }, []);
  const apiData = async () => {
    setIsLoading(true);
       const compUrl =  await getCompUrl();
    try {

      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETATTACHMENTDETAILS}/${props.dataItem.CompID}/${props.dataItem.ModuleID}/${props.dataItem.Year}/${props.dataItem.DocType}/${props.dataItem.DocNo}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            setattachmentsData(response.Data);

          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
       <ScrollView>
        {attachmentsData?.map((item) => (
          <View key={item.SlNo ?? item.CompID} style={styles.rowborder}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ flex: 1 }}>{item.UserDescription}</Text>
              <TouchableOpacity
                style={{ flex: 4 }}
                disabled={!item.FileName}
                onPress={() => {
                      openLink( item.FileName);
                  }
                }
              >
                <Text style={[styles.commonTextFont, styles.linkText]}>
                  {item.FileName}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <Text style={{ flex: 1 }}>{item.Validity}</Text>
              <Text style={{ flex: 4 }} numberOfLines={1} ellipsizeMode="tail">
                {item.InternalFileName}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      </>
      )}
    </View>
  );
}

function JvTab(props: PropsWithChildren<{ dataItem: any }>) {
  type JvItem = {
    SNo: number;
    Dept: string;
    Account: string;
    DETAIL: string;
    Ref: string;
    RefDt: string | null;
    DB_Amt: number;
    CR_Amt: number;
    CrossCharge: string;
  };
  const [selectedJv, setSelectedJv] = useState<JvItem | null>(null);

  const [jvData, setjvData] = useState<JvItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const useHttpService = useHttp();
  useEffect(() => {
    apiData();
  }, []);
  const apiData = async () => {
    setIsLoading(true);
       const compUrl =  await getCompUrl();
    try {
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVALDOCJVDETAILS}/${props.dataItem.ModuleID}/${props.dataItem.CompID}/${props.dataItem.Year}/${props.dataItem.DocType}/${props.dataItem.DocNo}/${props.dataItem.Autonum}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            setjvData(response.Data);

          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
      <ScrollView>
        {jvData?.map((item) => (
          <TouchableOpacity
            key={item.SNo ?? item.Ref}
            // onPress={() => {
            //   setSelectedJv(selectedJv?.SNo === item.SNo ? null : item);
            // }}
          >
            <View style={styles.rowborder}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ flex: 1 }}>{item.Dept}</Text>
                <Text
                  style={{ flex: 2, color: "#04447c", fontWeight: "bold" }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.Account}
                </Text>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <Text style={{ flex: 1 }}>{item.DETAIL}</Text>
                <Text
                  style={{ flex: 2 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.Ref}
                </Text>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 10 }}>
               {item.DB_Amt !== 0 && (<Text style={{ flex: 1 }}>Debit: {item.DB_Amt}</Text>)}
                {item.CR_Amt !== 0 && (<Text style={{ flex: 1 }}>Credit: {item.CR_Amt}</Text>)}
              </View>


              {/* {selectedJv && selectedJv.SNo === item.SNo && (
                <View style={styles.rowContent}>
                  <View style={styles.labelColumn}>
                    <Text style={styles.label}>Department:</Text>
                    <Text style={styles.label}>Account:</Text>

                    <Text style={styles.label}>Detail:</Text>
                    <Text style={styles.label}>Ref No:</Text>
                    <Text style={styles.label}>Ref Dt:</Text>
                    <Text style={styles.label}>Debit:</Text>
                    <Text style={styles.label}>Credit:</Text>
                    <Text style={styles.label}>Crosscharge:</Text>
                  </View>
                  <View style={styles.valueColumn}>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.Dept}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.Account}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.DETAIL}
                    </Text>
                    <Text style={styles.commonTextFont}>{selectedJv?.Ref}</Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.RefDt}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.DB_Amt}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.CR_Amt}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedJv?.DETAIL}
                    </Text>
                  </View>
                </View>
              )} */}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </>
      )}
    </View>
  );
}

function ApprovalLogTab(props: PropsWithChildren<{ dataItem: any }>) {
  type ApprovalLogItem = {
    AutoNum: string;
    Status: string;
    ApprovedLevel: string;
    ApprovedByUser: string;
    ApprovedDt: string;
    QueryTo: string;
    Remarks: string;
    id?: string | number; // Add this if you use 'id' as key elsewhere
  };
  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalLogItem | null>(null);

  const [approvalLogData, setApprovalLogData] = useState<ApprovalLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const useHttpService = useHttp();
  useEffect(() => {
    apiData();
  }, []);
  const apiData = async () => {
    setIsLoading(true);
       const compUrl =  await getCompUrl();
    try {
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVALSLOGDETAILS}/${props.dataItem.ModuleID}/${props.dataItem.DocType}/${props.dataItem.Autonum}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            setApprovalLogData(response.Data);

          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
      <ScrollView>
        {approvalLogData?.map((item) => (
          <TouchableOpacity
            key={item.id ?? item.AutoNum}
            onPress={() => {
              setSelectedApproval(
                selectedApproval?.id === item.id ? null : item
              );
            }}
          >
            <View style={styles.rowborder}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ flex: 2 }}>{item.Status}</Text>
                <Text
                  style={{ flex: 2, color: "#04447c", fontWeight: "bold" }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ApprovedByUser}
                </Text>

                                <Text
                  style={{ flex: 2, color: "#04447c" }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ApprovedLevel}
                </Text>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <Text style={{ flex: 2 }}>{item.ApprovedDt}</Text>
                <Text
                  style={{ flex: 2 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.QueryTo}
                </Text>
              </View>

              {selectedApproval && selectedApproval.id === item.id && (
                <View style={styles.rowContent}>
                  <View style={styles.labelColumn}>
                    <Text style={styles.label}>Autonum:</Text>
                    <Text style={styles.label}>Status:</Text>

                    <Text style={styles.label}>Approved Level:</Text>
                    <Text style={styles.label}>Approved By:</Text>
                    <Text style={styles.label}>Approved Dt:</Text>
                    <Text style={styles.label}>Query To:</Text>
                    <Text style={styles.label}>Remarks:</Text>
                  </View>
                  <View style={styles.valueColumn}>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.AutoNum}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.Status}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.ApprovedLevel}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.ApprovedByUser}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.ApprovedDt}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.QueryTo}
                    </Text>
                    <Text style={styles.commonTextFont}>
                      {selectedApproval?.Remarks}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </>
      )}
    </View>
  );
}

type queryPayload = {
  ModuleID: string;
  DocType: string;
  DocAutonum: string;
  FromUser: string;
  ToUser: string;
  MailSubject: string;
  MailBody: string;
  AppType: string;
  CompID: string;
  Remarks: string;
  QueryLevel: string;
};


function ActionTab(props: PropsWithChildren<{ dataItem: any }>) {
  const [toUser,setToUser]=useState<any[]>([]);
  const [selectActionType, setSelectActionType] = useState("Query"); // Set default value to match one of the actionOptions
  const [selectUser,setSelectUser]=useState("");  
  const useHttpService = useHttp();
  const [textData, setTextData] = useState("");
  const navigation = useNavigation();

  // new array as requested
  const actionOptions: any = [{label:"Reject",value:"Reject"},
  {label:"Remarks",value:"Remarks"},
  {label:"Query",value:"Query"}
  ];
  const getActionTypeValue=()=>{
  switch(selectActionType){
    case 'Reject':
      return 'R';
    case 'Query':
      return 'Q';
    case 'Remarks':
      return 'A';
    default: 
      return '';
}
  }
  useEffect(() => {
    fetchToDetails();
  }, []);



  const fetchApiDetails = async () => {
  let queryDetails: queryPayload = {
    ModuleID: props.dataItem.ModuleID,
    DocType: props.dataItem.DocType,
    DocAutonum: props.dataItem.Autonum,
    FromUser: props.dataItem.UserID,
    ToUser: selectActionType==='Query'?selectUser:'',
    MailBody: selectActionType==='Query' || selectActionType==='Remarks'? textData:'',
    MailSubject: "",
    AppType: getActionTypeValue(),
    CompID: props.dataItem.CompID,
    Remarks: selectActionType==='Remarks'? textData:'',
    QueryLevel: props.dataItem.Query,
  };
  try {
     const compUrl =  await getCompUrl();
    const data = await useHttpService
    .sendRequest(
      `${compUrl}/api/${endpointConstants.UPDATEAPPROVEDMAILS}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: queryDetails,
      }
    )
    .then(async (response: any) => {
      
      if (response) {
     
        //@ts-ignore
      navigation.navigate("List");
      } else {
      }
    });
  } catch (err: any) {
    console.error("Error fetching data", err);
  }
  };
  const fetchToDetails = async () => {
    const compUrl =  await getCompUrl();
    try{
      const data = await useHttpService
    .sendRequest(
      `${compUrl}/api/${endpointConstants.GETAPPROVALUSERS}/${props.dataItem.ModuleID}/${props.dataItem.DocType}/${props.dataItem.Autonum}`,
      {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },  

      })
    .then(async (response: any) => {
      if (response) {
        const formattedOptions = response?.Data?.map((dataVal: any) => ({
            label: dataVal.UserId, // Adjust based on the actual property name
            value: dataVal.UserId, // Adjust based on the actual property name
          }));
       setToUser([
            { label: "Select User", value: "" },
            ...formattedOptions,
          ]);
      } else {
      }
    });
    } catch (err: any) {
    console.error("Error fetching data", err);
    }
  
  }
  return (
    <View style={styles.querycontainer}>
        <View
          style={{
            borderWidth: 1,
            borderColor: "#04447c",
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "#fff",
            height: 40, // Reduced height for a smaller dropdown
            width: 190,
            justifyContent: "flex-end",
            marginLeft: 10,
            top: 10,
            left: 70,
            alignItems: "flex-end", // Align dropdown to the right
          }}
        >
          <Dropdown
            onChange={(itemValue) => setSelectActionType(itemValue.value)}
            style={{ height: 40, width: "100%" }}
            data={actionOptions}
            value={selectActionType}
            disable={false}
            labelField="label"
            valueField="value"
            placeholder="Select company"
            placeholderStyle={{ color: '#999' }}
            selectedTextStyle={{ color: '#000' }}
            maxHeight={200}
          />
        </View>
    <View
    style={{
      minWidth: "90%",
      marginTop: 40,
      padding: 10,
      marginVertical: 6,
      marginHorizontal: 2,
    }}
    >
    {selectActionType==="Query" || selectActionType==="Remarks" ? 
    (
    <>
    <View style={{ flexDirection: "row" }}>
      <Text
      style={{
        fontWeight: "bold",
        color: "#04447c",
      }}
      >
      From
      </Text>
      <Text style={{ marginLeft: 10 }}>{props.dataItem.UserID}</Text>
      {/* Login user */}
    </View>
{selectActionType==="Query" ? (
  <View style={{flexDirection:"row",marginTop:8}}>
    <Text
      style={{
      fontWeight: "bold",
      color: "#04447c",
      marginTop: 8,
      }}
    >
      To
    </Text>
<View 
 style={{
  borderWidth: 1,
  borderColor: "#04447c",
  borderRadius: 6,
  overflow: "hidden",
  backgroundColor: "#fff",
  height: 40,
  width: 190,
  marginLeft: 10,
    }}>
   <Dropdown
  onChange={(itemValue) => setSelectUser(itemValue.value)}
  style={{ height: 40, width: "100%" }}
  data={toUser}
  value={selectUser}
  disable={false}
  labelField="label"
  valueField="value"
  placeholder="Select user"
  placeholderStyle={{ color: '#999' }}
  selectedTextStyle={{ color: '#000' }}
  maxHeight={300}
    />
</View>
   
    </View>
    ) : ''}

    <View style={{ flexDirection: "row" }}>
      <Text
      style={{
        fontWeight: "bold",
        color: "#04447c",
        marginTop: 13,
      }}
      >
      Subject
      </Text>
      <Text style={{ marginLeft: 10,
      marginTop: 13,
       }}>{props.dataItem.ModuleID}-{props.dataItem.DocType}-{props.dataItem.Autonum}</Text>
       {/* MM-PR-AUTONUM */}
    </View>

 
    </>
    ):<>
     </>}
    {selectActionType==="Query" || selectActionType==="Remarks" ? 
    (
    <>
      <Text
      style={{
      fontWeight: "bold",
      color: "#04447c",
      marginTop: 30,
      }}
    >
      Body
    </Text>
    </>
    ):
    (
       <>
      <Text
      style={{
      fontWeight: "bold",
      color: "#04447c",
      marginTop: 8,
      }}
    >
      Reason
    </Text>
    </>
    )
    }
    <TextInput
      placeholder="Body"
      onChangeText={setTextData}
       value={textData}
      style={{
      backgroundColor: "#fff",
      borderColor: "#ccc",
      borderWidth: 1,
      borderRadius: 6,
      padding: 8,
      marginTop: 8,
      marginBottom: 8,
      fontSize: 14,
      minHeight: 80, // makes it look like a textarea
      textAlignVertical: "top", // ensures text starts at the top
      }}
      multiline
      numberOfLines={100}
    />
    </View>
 <View style={{ flexDirection: "row"}}>

        <Pressable
    onPress={() => fetchApiDetails()}
    disabled={false}
    
    style={({ pressed }) => [
      styles.submitbutton,
      pressed && styles.buttonPressed,
    ]}
    >     
  <Text style={styles.submitButtonText}>Submit</Text>
    </Pressable>

    </View>

  </View>
  );
}

const DetailTab = createMaterialTopTabNavigator();

export default function DetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params as { item: any };
  function handleLogoutPress(): void {
    // Example: Clear user session and navigate to login screen
    // If using SecureStore or AsyncStorage, clear user data here
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  }

  return (
    <View style={styles.headercontainer}>
      <ImageBackground
        source={require("../../assets/images/headerbg.gif")} // Replace with your image path
        style={styles.header}
        resizeMode="cover"
      >
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity
            style={styles.logout}
            onPress={() => handleLogoutPress()}
          >
            <Icon name="logout" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.iconRow}>
        <Text style={styles.tableRowText}>{item.DocType}</Text>
        <Text style={styles.tableRowText}>{item.DocNo}</Text>
        <Text style={styles.tableRowText}>{item.DocDt}</Text>
        <Text style={[styles.tableRowText, { flex: 0.5 }]}>{item.CompID}</Text>
        <Text
          style={styles.tableRowText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.ReceivedFrom}
        </Text>
        <Text style={styles.tableRowText}>{item.Amount}</Text>
      </View>

      <DetailTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#04447c",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { backgroundColor: "#9db7c5" },
          tabBarIndicatorStyle: { backgroundColor: "#04447c" },
          lazy: true,
        }}
      >
        {(item.ModuleID === aceConstants.MODULES.MATERIALS || item.ModuleID === aceConstants.MODULES.PAYROLL_AND_HR) ? (
           <>
            <DetailTab.Screen
              name="Details"
              children={() => <DetailsTab dataItem={item} />}
            />
            <DetailTab.Screen
              name="JV"
              children={() => <JvTab dataItem={item} />}
            />
          </>
        ) : 
        (
        
            <>
            <DetailTab.Screen
              name="JV"
              children={() => <JvTab dataItem={item} />}
            />
            <DetailTab.Screen
              name="DET"
              children={() => <DetailsTab dataItem={item} />}
            />
          </>
        )
        }
        <DetailTab.Screen
          name="ATT"
          children={() => <AttachmentsTab dataItem={item} />}
        />
     
        <DetailTab.Screen
          name="LOG"
          children={() => <ApprovalLogTab dataItem={item} />}
        />
        <DetailTab.Screen
          name="ACT"
          children={() => <ActionTab dataItem={item} />}
        />
      </DetailTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  querycontainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headercontainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    width: width, // Set width to screen width
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 30,
    marginTop: 40,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: "center",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 5,
    marginBottom: 5,
  },
  tabContent: {
    flex: 1,
    width: "100%",
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  rowContent: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  labelColumn: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontWeight: "bold",
    color: "#04447c",
    marginBottom: 2,
  },
  iconText: {
    color: "#04447c",
    fontWeight: "bold",
    fontSize: 10, // adjust font size as needed
  },
  iconButton: {
    flexDirection: "column",
    alignItems: "center",
    flex: 2, // centers icon and text vertically
    borderColor: "rgba(192, 202, 192, 1)",
    borderWidth: 1,
    padding: 2,
    margin: 2,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
  },
  commonTextFont: {
    fontSize: 14,
    fontWeight: 600,
  },
  valueColumn: {
    flex: 2,
    justifyContent: "space-between",
  },
  detailContainer: {
    padding: 16,
    backgroundColor: "#e6f2ea",
    borderRadius: 8,
    marginTop: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#04447c",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "80%",
    //alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#04447c",
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
    alignSelf: "flex-end",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  rowborder: {
    borderBottomWidth: 1,
    borderBottomColor: "#adab9cff",
    paddingVertical: 10,
  },
  linkText: {
    color: "#04447c",
    textDecorationLine: "underline",
  },

  tableRowText: {
    flex: 1,
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 5,
    color: "#04447c",
    fontWeight: "bold",
  },
  submitbutton: {
    padding: 5,
    borderRadius: 5,
    width: 62,
    color: "#fff",
    height: 38,
    textAlign: "center",
    backgroundColor: "#04447C",
  },
  buttonPressed: {
    backgroundColor: "#04447C",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },

  logout: {
    marginRight: 5, // Add some spacing between the icon and text
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionPicker: {
    width: 160,
    height: 60,
    color: '#000',
    backgroundColor: '#fff',
  },
  
  
});
   