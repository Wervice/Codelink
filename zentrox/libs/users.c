#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <shadow.h>
#include <stdlib.h>
#include <time.h>

#define MAX_STRING 2048

// This application creates and updates users for Zentrox

// TODO 1. User update (mode = 1)
// TODO     a) Modify user
// TODO     b) Update userlist (may also have >1 users)
// TODO     c) Update .conf if required x
// TODO 2. Initial configuration update
// TODO     a) Like 1.b and .c
// TODO     b) systemctl restart

int chpasswd(const char *username, const char *password)
{
    if (!strcmp("root", username))
    {
        printf("Can not change root");
        return -4;
    }    
    char *password_encrypted;
    int user_password_changed = 0;
    struct spwd *shadow_entry;
    FILE *tempfile = tmpfile();

    FILE *shadow_file = fopen("/home/constantin/shadow.txt", "r");

    if (!shadow_file)
    {
        printf("Failed to open /etc/passwd\nPlease make sure, you run this program as root.\n");
        return -2;
    }
  
    while ((shadow_entry = fgetspent(shadow_file)) != NULL)
    {
        if (!strcmp(shadow_entry->sp_namp, username))
        {
            printf("Found user with name %s \n", shadow_entry->sp_namp);
            
            char setting_prefix[MAX_STRING] = "$6$";
            char setting_suffix[2] = "$";
            char time_string[16];
            time_t current_time;
            current_time = time(NULL);
            snprintf(time_string, 16, "%ld", current_time);
            snprintf(setting_prefix, MAX_STRING - 8, "$6$%s$", time_string);
            
            /* 
            strncat(setting_prefix, time_string, strlen(setting_prefix));
            strncat(setting_prefix, setting_suffix, strlen(setting_prefix));
            */

            password_encrypted = crypt(password, setting_prefix);

            if (password_encrypted == NULL)
            {
                printf("Failed to encrypt password.\n");
                exit(-3);
            }
             
            strncpy(shadow_entry->sp_pwdp, password_encrypted, sizeof(shadow_entry->sp_pwdp)+512);
            if (strcmp(shadow_entry->sp_pwdp, password_encrypted)) {
              printf("Failed to strncpy to struct\n");
              exit(-3);
            }

            printf("Passwod in struct is changed to %s\n", shadow_entry->sp_pwdp);
            
            int write_to_file = putspent(shadow_entry, tempfile);

            if (write_to_file != 0)
            {
                printf("Failed to write to file (%d)\n", write_to_file);
                exit(-4);
            }

            user_password_changed = 1;
        }
        else
        {
            putspent(shadow_entry, tempfile);
        }
    }
  
    if (user_password_changed == 0)
    {
        printf("No user was found");
        exit(-1);
    }

    rewind(tempfile);

    fclose(shadow_file);

    shadow_file = fopen("/home/constantin/shadow.txt", "w"); // ? I changed the file to a copy for now.

    int c;

    while ((c = fgetc(tempfile)) != EOF)
    {
        fputc(c, shadow_file);
    }

    fclose(tempfile);
    fclose(shadow_file);
    return 0;
}

int chusernm(const char *username, const char *new_username) {
  struct spwd *shadow_entry;
  FILE *tempfile = tmpfile();
  FILE *shadow_file = fopen("/home/constantin/shadow.txt", "r");
 
  if (!shadow_file)
  {
      printf("Failed to open /etc/passwd\nPlease make sure, you run this program as root.\n");
      return -2;
  }

  while ((shadow_entry = fgetspent(shadow_file)) != NULL) {
    if (!strcmp(shadow_entry->sp_namp, username)) {
      strncpy(shadow_entry->sp_namp, new_username, 512);
      putspent(shadow_entry, tempfile);
    }
    else {
      putspent(shadow_entry, tempfile);
    }
  }

  rewind(tempfile);
  fclose(shadow_file);
  shadow_file = fopen("/home/constantin/shadow.txt", "w");

  int c;
  while ((c = fgetc(tempfile)) != EOF)
  {
    fputc(c, shadow_file);
  }
  
  fclose(tempfile);
  fclose(shadow_file);
  return 0; 
}

int main(int argc, char *argv[])
{

    if (geteuid() == 0 || !strcmp(argv[5], "t")) {
        ;
    } else {
        printf("You are not root.\n");
        exit(-2);
    }

    int mode = 0;

    if (argc < 2)
    {
        printf("Too few arguments.\n");
        exit(-1);
    }

    if (!strcmp(argv[1], "updateUser"))
    {
        // Update user

        if (strlen(argv[4]) > 512 - 1) {
          printf("Malformed password (strlen() > 512 - 1)\n");
          exit(-1);
        }

        // Determine which attribute to change
        if (!strcmp(argv[2], "password")) {
          chpasswd(argv[3], argv[4]);
          // Change password  
        }
        else if (!strcmp(argv[2], "username")){
          printf("Username is still missing...\n");
          chusernm(argv[3], argv[4]);
        }
        else {
          printf("This user attribute is not know to this program.\n");
          exit(-1);
        }
    }
    else if (!strcmp(argv[1], "updateConfig"))
    {
        // ? Update vsftpdConfig
        printf("Config can not be edited at the time.\n");
    }
    else
    {
        printf("This command was not found.\n");
        exit(-1);
    }
}
